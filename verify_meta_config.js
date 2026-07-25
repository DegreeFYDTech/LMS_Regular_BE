import { MetaConfig, getMetaUrl } from './config/meta.js';


if (MetaConfig.VERSION === 'v24.0' || (process.env.META_GRAPH_VERSION && MetaConfig.VERSION === process.env.META_GRAPH_VERSION)) {
} else {
}
