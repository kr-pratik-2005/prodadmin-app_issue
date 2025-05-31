import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const DailyReport = ({ selectedDate }) => {
  const [formData, setFormData] = useState({
    childName: '',
    activities: '',
    meals: '',
    napTime: '',
    notes: ''
  });
  const [presentChildren, setPresentChildren] = useState({});
  const [reportedChildren, setReportedChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load present children from attendance
  useEffect(() => {
    const loadPresentChildren = async () => {
      if (!selectedDate) return;
      setLoading(true);
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, where('date', '==', selectedDate));
      const snapshot = await getDocs(q);

      const present = {};
      snapshot.forEach(doc => {
        if (doc.data().status === 'present') {
          present[doc.data().childName] = true;
        }
      });
      setPresentChildren(present);
      setLoading(false);
    };

    loadPresentChildren();
  }, [selectedDate]);

  // Load already reported children
  useEffect(() => {
    const loadReportedChildren = async () => {
      if (!selectedDate) return;
      setLoading(true);
      const reportsRef = collection(db, 'dailyReports');
      const q = query(reportsRef, where('date', '==', selectedDate));
      const snapshot = await getDocs(q);

      const reported = [];
      snapshot.forEach(doc => {
        reported.push(doc.data().childName);
      });
      setReportedChildren(reported);
      setLoading(false);
    };

    loadReportedChildren();
  }, [selectedDate]);

  const isReportComplete = (data) => {
    return data.activities && data.meals && data.napTime;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const status = isReportComplete(formData) ? 'complete' : 'partial';

    try {
      await addDoc(collection(db, 'dailyReports'), {
        ...formData,
        date: selectedDate,
        status: status
      });

      setReportedChildren([...reportedChildren, formData.childName]);
      setFormData({ childName: '', activities: '', meals: '', napTime: '', notes: '' });

    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  const presentNames = Object.keys(presentChildren);
  const missingReports = presentNames.filter(name => !reportedChildren.includes(name));

  if (loading) return <div>Loading...</div>;

  return (
    <div className="daily-report">
      <h2>Daily Report for {selectedDate}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Child's Name:</label>
          <select
            value={formData.childName}
            onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
            required
          >
            <option value="">Select Child</option>
            {presentNames
              .filter(name => !reportedChildren.includes(name))
              .map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label>Activities:</label>
          <input
            type="text"
            value={formData.activities}
            onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Meals:</label>
          <input
            type="text"
            value={formData.meals}
            onChange={(e) => setFormData({ ...formData, meals: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Nap Time:</label>
          <input
            type="text"
            value={formData.napTime}
            onChange={(e) => setFormData({ ...formData, napTime: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Notes:</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <button type="submit" disabled={!formData.childName}>Submit Report</button>
      </form>

      {/* ===== STATUS SECTION ===== */}
      <div className="completion-status" style={{ marginTop: '30px', textAlign: 'center' }}>
        {missingReports.length === 0 && presentNames.length > 0 ? (
          <p className="status-complete" style={{
            color: '#2ecc71',
            fontWeight: 600,
            padding: '15px',
            border: '2px solid #2ecc71',
            borderRadius: '8px'
          }}>
            ✅ All reports for present students are filled!
          </p>
        ) : (
          <p className="status-partial" style={{
            color: '#f39c12',
            fontWeight: 600,
            padding: '15px',
            border: '2px solid #f39c12',
            borderRadius: '8px'
          }}>
            ⚠️ Reports pending for: {missingReports.join(', ') || 'No present students'}
          </p>
        )}
      </div>
    </div>
  );
};

export default DailyReport;
