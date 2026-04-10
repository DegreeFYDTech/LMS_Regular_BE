import { StudentQuestionResponse } from '../models/index.js';
import sequelize from '../config/database-config.js';
import { QueryTypes } from 'sequelize';
import redis from '../config/redis.js';

export const getAdvancedFilterSchema = async (req, res) => {
  const CACHE_KEY = 'student:advanced_filter_schema';
  const CACHE_TTL = 1800; // 30 minutes

  try {
    // 1. Try to get from Redis (with 1s timeout)
    if (redis && redis.status === 'ready') {
      try {
        const cachedData = await Promise.race([
          redis.get(CACHE_KEY),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
        ]);
        
        if (cachedData) {
          return res.json({
            success: true,
            fields: JSON.parse(cachedData),
            cached: true
          });
        }
      } catch (e) {
        console.warn('Redis Cache Get Failed or Timed out:', e.message);
      }
    }

    // 2. If not in Redis, fetch from DB
    const [results] = await sequelize.query(`
      SELECT 
        question, 
        array_agg(DISTINCT val) FILTER (WHERE val IS NOT NULL AND val != '') AS options
      FROM (
        -- 1. Unnest Native JSONB Arrays
        SELECT question, jsonb_array_elements_text(answer) as val
        FROM student_question_responses
        WHERE jsonb_typeof(answer) = 'array'
        
        UNION ALL
        
        -- 2. Handle Double-Stringified Arrays (Strings that look like [1,2])
        SELECT question, jsonb_array_elements_text((answer #>> '{}')::jsonb) as val
        FROM student_question_responses
        WHERE jsonb_typeof(answer) = 'string' 
        AND (answer #>> '{}' ~ '^\\[.*\\]$')
        
        UNION ALL
        
        -- 3. Handle Plain Strings and other types
        SELECT question, answer #>> '{}' as val
        FROM student_question_responses
        WHERE jsonb_typeof(answer) != 'array'
        AND NOT (jsonb_typeof(answer) = 'string' AND (answer #>> '{}' ~ '^\\[.*\\]$'))
      ) s
      GROUP BY question
      ORDER BY question ASC
    `);

    const fields = results.map(r => {
      let unnestedOptions = new Set();
      
      (r.options || []).forEach(opt => {
        if (typeof opt === 'string') {
          const trimmed = opt.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                parsed.forEach(p => unnestedOptions.add(p?.toString() || ''));
              } else {
                unnestedOptions.add(trimmed);
              }
            } catch (e) {
              unnestedOptions.add(trimmed);
            }
          } else {
            unnestedOptions.add(trimmed);
          }
        } else if (opt !== null && opt !== undefined) {
          unnestedOptions.add(opt.toString());
        }
      });

      return {
        key: r.question,
        label: r.question, 
        options: Array.from(unnestedOptions).filter(o => o !== '').sort().slice(0, 100) 
      };
    });

    if (redis && redis.status === 'ready') {
      try {
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(fields));
      } catch (e) {
        console.warn('Redis Cache Set Failed:', e.message);
      }
    }

    res.json({
      success: true,
      fields
    });
  } catch (error) {
    console.error('Advanced Filter Schema Error:', error);
    res.status(500).json({ error: 'Failed to fetch advanced filter schema' });
  }
};
