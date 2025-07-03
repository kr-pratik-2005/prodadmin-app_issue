import React, { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

/**
 * Converts a time string stored in AM/PM format (e.g. "2:30 PM")
 * to the 24-hour format (e.g. "14:30") required for <input type="time">
 */
function convertTo24HourFormat(timeStr) {
  if (!timeStr) return "";
  const [time, modifier] = timeStr.split(' ');
  if (!modifier) return timeStr;
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

/**
 * Converts a 24‑hour time string (e.g. "14:30")
 * into a 12‑hour AM/PM string (e.g. "2:30 PM")
 */
function convertTo12HourFormat(time24) {
  if (!time24) return "";
  let [hourStr, minute] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

const DailyReport = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const childFromUrl = urlParams.get('child') || '';

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({
    childName: '',
    emails: [],
    inTime: '',
    outTime: '',
    snack: '',
    meal: '',
    sleepFrom: '',
    sleepTo: '',
    sleepNot: false,
    noDiaper: false,
    diaperChanges: '',
    toiletVisits: '',
    poops: '',
    feelings: [],
    notes: '',
    themeOfTheDay: [],
    ouch: false,
    ouchReport: '',
    commonParentsNote: ''
  });
  const [availableThemes, setAvailableThemes] = useState([]);
  const [students, setStudents] = useState({});
  const [presentChildren, setPresentChildren] = useState([]);

  const feelingsOptions = [
    { label: 'Happy' },
    { label: 'Sad' },
    { label: 'Restless' },
    { label: 'Quiet' },
    { label: 'Playful' },
    { label: 'Sick' }
  ];

  // Fetch available themes
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const themeRef = doc(db, 'appConfig', 'themeOfTheWeek');
        const snap = await getDoc(themeRef);
        if (snap.exists()) {
          const data = snap.data();
          let themes = [];
          if (Array.isArray(data.theme)) {
            themes = data.theme;
          } else if (typeof data.theme === 'string' && data.theme.trim()) {
            themes = data.theme.split(',').map(t => t.trim());
          }
          setAvailableThemes(themes);
        }
      } catch (err) {
        console.error('Error fetching themes:', err);
      }
    };
    fetchThemes();
  }, []);

  // Fetch attendance and students once per day
  useEffect(() => {
    const fetchAttendanceAndStudents = async () => {
      // Attendance
      const attendanceQuery = query(
        collection(db, 'attendance_records'),
        where('date', '==', today),
        where('status', '==', 'present')
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      const childIds = [];
      attendanceSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.student_id) {
          childIds.push(data.student_id);
        }
      });
      setPresentChildren(childIds);

      // Students
      const kidsSnapshot = await getDocs(collection(db, 'students'));
      const studentsObj = {};
      kidsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        studentsObj[data.student_id] = data;
      });
      setStudents(studentsObj);
    };
    fetchAttendanceAndStudents();
  }, [today]);

  // Real-time listener for dailyReports
  useEffect(() => {
    if (presentChildren.length === 0) {
      setReports([]); // No children present
      return;
    }
    // Set up real-time listener for dailyReports
    const dateObj = new Date(today);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1);

    const reportsQuery = query(
      collection(db, 'dailyReports'),
      where('date', '>=', startOfDay),
      where('date', '<', endOfDay)
    );

    const unsubscribe = onSnapshot(reportsQuery, (reportsSnap) => {
      const dailyReports = {};
      reportsSnap.docs.forEach(d => {
        const data = d.data();
        dailyReports[data.student_id] = { id: d.id, ...data };
      });

      // Combine with attendance and students
      const combinedReports = presentChildren.map(studentId => {
        const existingReport = dailyReports?.[studentId];
        const kidInfo = students[studentId] || {};

        if (existingReport) {
          return existingReport;
        } else {
          // Placeholder for not-yet-submitted report
          const emails = [];
          if (kidInfo.email) emails.push(kidInfo.email);
          if (kidInfo.email2) emails.push(kidInfo.email2);
          return {
            id: null,
            student_id: studentId,
            childName: kidInfo.name || studentId,
            emails: emails,
            date: startOfDay,
            hasReport: false,
            inTime: '',
            outTime: '',
            snack: '',
            meal: '',
            sleepFrom: '',
            sleepTo: '',
            sleepNot: false,
            noDiaper: false,
            diaperChanges: '',
            toiletVisits: '',
            poops: '',
            feelings: [],
            notes: '',
            themeOfTheDay: [],
            ouch: false,
            ouchReport: '',
            commonParentsNote: ''
          };
        }
      });

      setReports(combinedReports);

      // If childFromUrl is specified, auto-select that child's report
      if (childFromUrl) {
        const childReport = combinedReports.find(report => report.childName === childFromUrl);
        if (childReport) {
          handleReportSelect(childReport);
        }
      }
    });

    // Clean up listener on unmount
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [today, presentChildren, students, childFromUrl]);

  // When a report is clicked, load into form
  const handleReportSelect = useCallback((report) => {
    setSelectedReport(report);
    let emailsArr = [];
    if (Array.isArray(report.emails) && report.emails.length) {
      emailsArr = report.emails;
    } else {
      if (report.email) emailsArr.push(report.email);
      if (report.email2) emailsArr.push(report.email2);
    }
    setFormData({
      childName: report.childName || '',
      emails: emailsArr,
      inTime: convertTo24HourFormat(report.inTime),
      outTime: convertTo24HourFormat(report.outTime),
      snack: report.snack || '',
      meal: report.meal || '',
      sleepFrom: convertTo24HourFormat(report.sleepFrom),
      sleepTo: convertTo24HourFormat(report.sleepTo),
      sleepNot: report.sleepNot || false,
      noDiaper: report.noDiaper || false,
      diaperChanges: report.diaperChanges || '',
      toiletVisits: report.toiletVisits || '',
      poops: report.poops || '',
      feelings: Array.isArray(report.feelings)
        ? report.feelings
        : typeof report.feelings === 'string'
          ? report.feelings.split(',').map(f => f.trim())
          : [],
      notes: report.notes || '',
      themeOfTheDay: Array.isArray(report.themeOfTheDay)
        ? report.themeOfTheDay
        : typeof report.themeOfTheDay === 'string'
          ? report.themeOfTheDay.split(',').map(t => t.trim())
          : [],
      ouch: report.ouch || false,
      ouchReport: report.ouchReport || '',
      commonParentsNote: report.commonParentsNote || ''
    });
  }, []);

  // Form change handler
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'sleepNot') {
      setFormData(prev => ({ ...prev, sleepNot: checked, sleepFrom: '', sleepTo: '' }));
    } else if (type === 'checkbox' && name === 'feelings') {
      setFormData(prev => prev.feelings.includes(value)
        ? { ...prev, feelings: prev.feelings.filter(f => f !== value) }
        : { ...prev, feelings: [...prev.feelings, value] }
      );
    } else if (type === 'checkbox' && name === 'themeOfTheDay') {
      setFormData(prev => prev.themeOfTheDay.includes(value)
        ? { ...prev, themeOfTheDay: prev.themeOfTheDay.filter(t => t !== value) }
        : { ...prev, themeOfTheDay: [...prev.themeOfTheDay, value] }
      );
    } else if (type === 'checkbox' && name === 'ouch') {
      setFormData(prev => ({ ...prev, ouch: checked, ouchReport: checked ? prev.ouchReport : '' }));
    } else if (type === 'checkbox' && name === 'noDiaper') {
      setFormData(prev => ({
        ...prev,
        noDiaper: checked,
        diaperChanges: checked ? '' : prev.diaperChanges,
        toiletVisits: checked ? prev.toiletVisits : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Update or Create Report in Firestore
  const handleUpdate = async e => {
    e.preventDefault();
    try {
      const reportData = {
        student_id: selectedReport.student_id || '',
        childName: formData.childName,
        emails: formData.emails,
        inTime: convertTo12HourFormat(formData.inTime),
        outTime: convertTo12HourFormat(formData.outTime),
        snack: formData.snack,
        meal: formData.meal,
        sleepFrom: convertTo12HourFormat(formData.sleepFrom),
        sleepTo: convertTo12HourFormat(formData.sleepTo),
        sleepNot: formData.sleepNot,
        noDiaper: formData.noDiaper,
        diaperChanges: formData.diaperChanges,
        toiletVisits: formData.toiletVisits,
        poops: formData.poops,
        feelings: formData.feelings,
        notes: formData.notes,
        themeOfTheDay: formData.themeOfTheDay,
        ouch: formData.ouch,
        ouchReport: formData.ouchReport,
        commonParentsNote: formData.commonParentsNote,
        date: new Date(today),
        timestamp: new Date().toISOString(),
        status: 'complete'
      };

      if (selectedReport.id) {
        // Update existing report
        const ref = doc(db, 'dailyReports', selectedReport.id);
        await updateDoc(ref, reportData);
        alert('Report updated successfully!');
      } else {
        // Create new report
        await addDoc(collection(db, 'dailyReports'), reportData);
        alert('Report created successfully!');
      }

      setSelectedReport(null);
      // No need to manually refresh, onSnapshot will update the list automatically

    } catch (err) {
      console.error('Error updating/creating report:', err);
      alert('Failed to save report.');
    }
  };

  // --- Styles ---
  const styles = {
    container: {
      padding: '0',
      fontFamily: 'Inter, Arial, sans-serif',
      background: '#f8f9fa',
      minHeight: '100vh',
      maxWidth: '100%'
    },
    header: {
      textAlign: 'left',
      marginBottom: '0px',
      color: '#333',
      fontSize: '18px',
      fontWeight: '600',
      padding: '16px 20px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #e9ecef',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    backArrow: {
      fontSize: '18px',
      cursor: 'pointer',
      color: '#666'
    },
    dateDisplay: {
      display: 'none'
    },
    gridContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      justifyContent: 'center'
    },
    reportBox: {
      width: '150px',
      height: '150px',
      backgroundColor: '#fffbee',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      textAlign: 'center',
      position: 'relative',
      marginTop: '20px'
    },
    reportStatus: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      fontSize: '12px',
      padding: '2px 6px',
      borderRadius: '10px',
      fontWeight: 'bold'
    },
    reportStatusSubmitted: {
      backgroundColor: '#d4edda',
      color: '#155724'
    },
    reportStatusPending: {
      backgroundColor: '#fff3cd',
      color: '#856404'
    },
    formContainer: {
      backgroundColor: '#fff',
      padding: '0',
      borderRadius: '0',
      boxShadow: 'none',
      maxWidth: '100%',
      margin: '0',
      minHeight: '100vh'
    },
    formContent: {
      padding: '20px'
    },
    label: {
      fontWeight: '800',
      marginBottom: '8px',
      paddingBottom: '2px',
      display: 'block',
      color: '#565657',
      fontSize: '14px'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '20px',
      borderRadius: '20px',
      border: '1px solid #e9ecef',
      fontSize: '16px',
      outline: 'none',
      backgroundColor: '#fff',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 12px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '20px',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      fontSize: '16px',
      outline: 'none',
      backgroundColor: '#fff',
      boxSizing: 'border-box'
    },
    inputTime: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '20px',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      fontSize: '16px',
      outline: 'none',
      backgroundColor: '#fff'
    },
    timeContainer: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px',
    },
    timeField: {
      flex: 1,
    },
    timeLabel: {
      fontSize: '14px',
      fontWeight: '800',
      marginBottom: '4px',
      marginLeft: '4px',
      paddingBottom: '6px',
      display: 'block',
      color: '#565657',
    },
    buttonGroup: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      marginBottom: '20px'
    },
    toggleButton: {
      padding: '10px 40px',
      borderRadius: '20px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: '#5A5B5F',
      color: '#ffffff',
      fontWeight: 'bold',
    },
    toggleButtonActive: {
      backgroundColor: '#D3F26A',
      color: '#5A5B5F'
    },
    checkboxContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      marginBottom: '20px'
    },
    checkboxButton: {
      padding: '8px 12px',
      borderRadius: '16px',
      border: 'none',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: '#5A5B5F',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      fontWeight: 'bold',
    },
    checkboxButtonActive: {
      backgroundColor: '#D3F26A',
      color: '#5A5B5F'
    },
    photoUpload: {
      border: '2px solid #e9ecef',
      borderRadius: '20px',
      padding: '40px 20px',
      textAlign: 'center',
      marginBottom: '20px',
      backgroundColor: '#ffffff',
      cursor: 'pointer'
    },
    photoUploadIcon: {
      fontSize: '24px',
      marginBottom: '8px',
      color: '#999'
    },
    photoUploadText: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#98989A'
    },
    submitButton: {
      width: '100%',
      background: '#D3F26A',
      color: '#565657',
      fontWeight: '600',
      fontSize: '16px',
      padding: '16px',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      margin: '20px 0'
    },
    backButton: {
      backgroundColor: 'transparent',
      color: '#666',
      padding: '10px 20px',
      border: 'none',
      cursor: 'pointer',
      display: 'block',
      margin: '20px auto 0'
    }
  };

  return (
    <div style={styles.container}>
      {!selectedReport ? (
        <>
          <div style={styles.header}>
            <span style={styles.backArrow} onClick={() => navigate('/')}>
              ←
            </span>
            Daily Updates
          </div>

          {reports.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No children are present today.</p>
          ) : (
            <div style={styles.gridContainer}>
              {reports.map((report, idx) => {
                const colors = ['#A0C4FF', '#FFD6A5', '#FFC6FF', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#BDB2FF', '#FFC6FF'];
                const hasSubmittedReport = report.id !== null;

                return (
                  <div
                    key={`${report.childName}-${idx}`}
                    style={{ ...styles.reportBox, backgroundColor: colors[idx % colors.length] }}
                    onClick={() => handleReportSelect(report)}
                  >
                    <div
                      style={{
                        ...styles.reportStatus,
                        ...(hasSubmittedReport ? styles.reportStatusSubmitted : styles.reportStatusPending)
                      }}
                    >
                      {hasSubmittedReport ? '✓' : '!'}
                    </div>
                    <strong>{report.childName}</strong>
                    <div style={{ fontSize: '10px', marginTop: '5px' }}>
                      {hasSubmittedReport ? 'Report Submitted' : 'Pending Report'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={styles.formContainer}>
          <div style={styles.header}>
            <span style={styles.backArrow} onClick={() => setSelectedReport(null)}>
              ←
            </span>
            Daily Updates
          </div>

          <form style={styles.formContent} onSubmit={handleUpdate}>
            <label style={styles.label}>Name</label>
            <select
              name='childName'
              style={styles.select}
              value={formData.childName}
              onChange={handleChange}
              disabled
            >
              <option value={formData.childName}>{formData.childName}</option>
            </select>

            {/* In/Out Time */}
            <div style={styles.timeContainer}>
              <div style={styles.timeField}>
                <label style={styles.timeLabel}>In</label>
                <select
                  style={styles.select}
                  name='inTime'
                  value={formData.inTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, inTime: e.target.value }))}
                >
                  <option value="">Select Time</option>
                  <option value="07:00">7:00 Am</option>
                  <option value="07:30">7:30 Am</option>
                  <option value="08:00">8:00 Am</option>
                  <option value="08:30">8:30 Am</option>
                  <option value="09:00">9:00 Am</option>
                  <option value="09:30">9:30 Am</option>
                  <option value="10:00">10:00 Am</option>
                </select>
              </div>
              <div style={styles.timeField}>
                <label style={styles.timeLabel}>Out</label>
                <select
                  style={styles.select}
                  name='outTime'
                  value={formData.outTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, outTime: e.target.value }))}
                >
                  <option value="">Select Time</option>
                  <option value="14:00">2:00 Pm</option>
                  <option value="14:30">2:30 Pm</option>
                  <option value="15:00">3:00 Pm</option>
                  <option value="15:30">3:30 Pm</option>
                  <option value="16:00">4:00 Pm</option>
                  <option value="16:30">4:30 Pm</option>
                  <option value="17:00">5:00 Pm</option>
                </select>
              </div>
            </div>

            {/* Snack */}
            <label style={styles.label}>Child Ate - Snacks</label>
            <div style={styles.buttonGroup}>
              {['All', 'Some', 'None'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  style={{
                    ...styles.toggleButton,
                    ...(formData.snack === opt ? styles.toggleButtonActive : {})
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, snack: opt }))}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Meal */}
            <label style={styles.label}>Child Ate - Meal</label>
            <div style={styles.buttonGroup}>
              {['All', 'Some', 'None'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  style={{
                    ...styles.toggleButton,
                    ...(formData.meal === opt ? styles.toggleButtonActive : {})
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, meal: opt }))}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Sleep */}
            <label style={styles.label}>Child slept</label>
            <div style={styles.timeContainer}>
              <div style={styles.timeField}>
                <label style={styles.timeLabel}>From</label>
                <select
                  style={styles.select}
                  name='sleepFrom'
                  value={formData.sleepFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, sleepFrom: e.target.value }))}
                  disabled={formData.sleepNot}
                >
                  <option value="">Select Time</option>
                  <option value="12:00">12:00 Pm</option>
                  <option value="12:30">12:30 Pm</option>
                  <option value="13:00">1:00 Pm</option>
                  <option value="13:30">1:30 Pm</option>
                  <option value="14:00">2:00 Pm</option>
                </select>
              </div>
              <div style={styles.timeField}>
                <label style={styles.timeLabel}>To</label>
                <select
                  style={styles.select}
                  name='sleepTo'
                  value={formData.sleepTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, sleepTo: e.target.value }))}
                  disabled={formData.sleepNot}
                >
                  <option value="">Select Time</option>
                  <option value="13:00">1:00 Pm</option>
                  <option value="13:30">1:30 Pm</option>
                  <option value="14:00">2:00 Pm</option>
                  <option value="14:30">2:30 Pm</option>
                  <option value="15:00">3:00 Pm</option>
                </select>
              </div>
            </div>

            {/* Diaper Changes / Toilet Visits */}
            <label style={styles.label}>Child Diaper Was Changed</label>
            <div style={styles.timeContainer}>
              <div style={styles.timeField}>
                <label style={styles.timeLabel}>No of times</label>
                <select
                  style={styles.select}
                  name='diaperChanges'
                  value={formData.diaperChanges}
                  onChange={handleChange}
                  disabled={formData.noDiaper}
                >
                  <option value="">Select</option>
                  <option value="0">00</option>
                  <option value="1">01</option>
                  <option value="2">02</option>
                  <option value="3">03</option>
                  <option value="4">04</option>
                  <option value="5">05</option>
                </select>
              </div>
              <div style={styles.timeField}>
                <label style={styles.timeLabel}>No of poops</label>
                <select
                  style={styles.select}
                  name='poops'
                  value={formData.poops}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="0">00</option>
                  <option value="1">01</option>
                  <option value="2">02</option>
                  <option value="3">03</option>
                  <option value="4">04</option>
                  <option value="5">05</option>
                </select>
              </div>
            </div>

            {/* Feelings */}
            <label style={styles.label}>Child was feeling</label>
            <div style={styles.checkboxContainer}>
              {feelingsOptions.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  style={{
                    ...styles.checkboxButton,
                    ...(formData.feelings.includes(opt.label) ? styles.checkboxButtonActive : {})
                  }}
                  onClick={() => {
                    const newFeelings = formData.feelings.includes(opt.label)
                      ? formData.feelings.filter(f => f !== opt.label)
                      : [...formData.feelings, opt.label];
                    setFormData(prev => ({ ...prev, feelings: newFeelings }));
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Photo Upload */}
            <label style={styles.label}>Add photos</label>
            <div style={styles.photoUpload}>
              <div style={styles.photoUploadIcon}>⊕</div>
              <div style={styles.photoUploadText}>Add photos here</div>
            </div>

            {/* Teacher's Note */}
            <label style={styles.label}>Teacher's note</label>
            <textarea
              name='notes'
              rows='4'
              style={styles.input}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Type any keywords"
              className="custom-placeholder"
            />

            <button type="submit" style={styles.submitButton}>
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
