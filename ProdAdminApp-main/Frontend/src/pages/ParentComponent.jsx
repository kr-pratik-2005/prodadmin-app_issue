import React, { useState } from 'react';
import DailyReport from './DailyReport'; // Adjust the path if needed

const ParentComponent = () => {
  const [selectedDate, setSelectedDate] = useState('');

  return (
    <div>
      <h1>Attendance & Daily Report</h1>
      <label>
        Select Date: 
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </label>
      {/* Only show DailyReport if a date is selected */}
      {selectedDate && <DailyReport selectedDate={selectedDate} />}
    </div>
  );
};

export default ParentComponent;
