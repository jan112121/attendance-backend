// utils/time.js

export const getPhilippineDate = () => {
  const now = new Date();

  // Convert to Philippine timezone (UTC+8)
  const philippineTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  );

  // Format as YYYY-MM-DD (matches your Attendance.date format)
  const year = philippineTime.getFullYear();
  const month = String(philippineTime.getMonth() + 1).padStart(2, '0');
  const day = String(philippineTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
