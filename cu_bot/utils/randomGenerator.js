const cities = [
  'Delhi', 'New Delhi', 'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad',
  'Chandigarh', 'Mohali', 'Panchkula', 'Jaipur', 'Lucknow', 'Kanpur',
  'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Jammu', 'Srinagar',
  'Shimla', 'Solan', 'Dehradun', 'Haridwar', 'Patna', 'Ranchi',
  'Kolkata', 'Guwahati', 'Bhubaneswar', 'Bhopal', 'Indore', 'Ahmedabad'
];

const disciplines = [
  'Engineering', 'Management', 'Computing', 'Commerce', 
  'Humanities', 'Applied Health Sciences'
];

const programs = [
  'Bachelor of Engineering (Computer Science and Engineering)',
  'Master of Business Administration',
  'Bachelor of Computer Applications',
  'Bachelor of Science',
  'Bachelor of Business Administration',
  'Bachelor of Commerce'
];

export const getRandomizedData = () => {
  const city = cities[Math.floor(Math.random() * cities.length)];
  const discipline = disciplines[Math.floor(Math.random() * disciplines.length)];
  const program = programs[Math.floor(Math.random() * programs.length)];
  
  // Random DOB between 1998 and 2007 (format: YYYY-MM-DD)
  const year = Math.floor(Math.random() * (2007 - 1998 + 1)) + 1998;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'); // Safe day limit to prevent date overflows
  
  return {
    city,
    discipline,
    program,
    dob: `${year}-${month}-${day}`
  };
};
