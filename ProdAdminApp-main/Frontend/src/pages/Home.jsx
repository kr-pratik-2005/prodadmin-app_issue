// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate,useLocation  } from 'react-router-dom';
import giraffeIcon from '../assets/Logo.png';
import star from '../assets/star.png';

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc // ✅ include setDoc here to avoid duplicate import
} from 'firebase/firestore';

import { db, auth } from '../firebase/firebase'; // ✅ single db import from the correct file
// adjust path if needed
const StarIcon = () => (
  <span style={{ color: '#FFD700', marginRight: '6px' }}>
     <img
            src={star}
            alt="Star"
            style={{ width: '20px', height: '20px' }}
          />
  </span>
);

const Home = ({ user }) => {
  const navigate = useNavigate();

  // State for theme of the week (all available tags) and for theme of the day.
  const [themeTags, setThemeTags] = useState([]);
  const location = useLocation();
  const [dayThemes, setDayThemes] = useState([]);
  const [kids, setKids] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [dailyReportsMapping, setDailyReportsMapping] = useState({});
  const [docId, setDocId] = useState(null);
  const [autoMarked, setAutoMarked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const presentCount = kids.filter(kid => attendanceData[kid.student_id]?.status === 'present').length;
const absentCount = kids.filter(kid => attendanceData[kid.student_id]?.status === 'absent').length;



  const markedCount = Object.keys(attendanceData).length;

  // Mobile-first responsive styles
  const styles = {
    container: {
      padding: '30px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      position: 'relative',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    giraffeIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '8px',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    },
    hamburgerMenu: {
      width: '28px',
      height: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      cursor: 'pointer',
      '@media (min-width: 768px)': {
        display: 'none',
      },
    },
    hamburgerLine: {
      width: '100%',
      height: '3px',
      backgroundColor: '#2c3e50',
      borderRadius: '2px',
    },
    mobileMenuDropdown: {
      position: 'absolute',
      top: '100%',
      right: '0',
      backgroundColor: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      borderRadius: '8px',
      padding: '8px',
      zIndex: 1000,
      marginTop: '8px',
      display: isMobileMenuOpen ? 'block' : 'none',
    },
    dayDateSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      padding: '0 4px',
    },
    dayTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#2c3e50',
      margin: 0,
      lineHeight: '1.2',
    },
    dateContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#6c757d',
      fontSize: '14px',
    },
    calendarIcon: {
      width: '16px',
      height: '16px',
      opacity: 0.7,
    },
    logoutButton: {
      padding: '6px 16px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#dc3545',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '12px',
      whiteSpace: 'nowrap',
    },
    desktopLogoutButton: {
      display: 'none',
      '@media (min-width: 768px)': {
        display: 'block',
      },
    },
    attendanceCard: {
      backgroundColor: '#6c757d',
      color: '#fff',
      padding: '20px 18px',
      borderRadius: '12px',
      marginBottom: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    attendanceTitle: {
      fontSize: '16px',
      fontWeight: '600',
      margin: '0 0 6px 0',
    },
    attendanceProgress: {
      fontSize: '20px',
      fontWeight: '700',
      margin: '0 0 12px 0',
    },
    progressBarContainer: {
      width: '100%',
      height: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      marginBottom: '16px',
    },
    progressBar: {
      height: '20px',
      backgroundColor: '#a4c639',
      borderRadius: '12px',
      transition: 'width 0.4s ease',
    },
    themeRow: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
    },
    categoryTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#495057',
      marginBottom: '16px',
    },
    categoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      marginBottom: '24px',
    },
    categoryCard: {
      padding: '16px 12px',
      borderRadius: '8px',
      textAlign: 'center',
      color: '#fff',
      fontWeight: '600',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minHeight: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    childRecordTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#495057',
      marginBottom: '16px',
    },
    childrenContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '80px', 
    },
    childCard: {
      backgroundColor: '#F2F1F1',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'box-shadow 0.2s ease',
    },
    childInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
    },
    childAvatar: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: '#e9ecef',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      color: '#6c757d',
      flexShrink: 0,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    childDetails: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minWidth: 0, 
    },
    childName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#2c3e50',
      margin: '0 0 2px 0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    childId: {
      fontSize: '12px',
      color: '#6c757d',
      margin: '0 0 4px 0',
    },
    timeStamp: {
      fontSize: '10px',
      color: '#6c757d',
      marginTop: '2px',
    },
    attendanceButtons: {
      display: 'flex',
      gap: '8px',
      flexShrink: 0,
    },
    attendanceButton: {
      padding: '6px 14px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    presentButton: {
      backgroundColor: '#D3F26A',
      color: '#2c3e50',
    },
    absentButton: {
      backgroundColor: '#6c757d',
      color: '#fff',
    },
    presentButtonActive: {
      backgroundColor: '#D3F26A',
      color: '#2c3e50',
      fontWeight: '500',
    },
    absentButtonActive: {
      backgroundColor: '#dc3545',
      color: '#fff',
    },
    tickIcon: {
      color: '#28a745',
      fontSize: '14px',
    },
    outTimeButton: {
      padding: '4px 12px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '10px',
      fontWeight: '500',
      cursor: 'pointer',
      backgroundColor: '#495057',
      color: '#fff',
      marginTop: '4px',
      alignSelf: 'flex-start',
    },

    // Desktop styles
    '@media (min-width: 768px)': {
      container: {
        padding: '20px',
      },
      header: {
        marginBottom: '20px',
      },
      headerLeft: {
        gap: '15px',
      },
      giraffeIcon: {
        width: '70px',
        height: '70px',
      },
      dayDateSection: {
        marginBottom: '30px',
        padding: '0',
      },
      dayTitle: {
        fontSize: '32px',
      },
      categoryGrid: {
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '15px',
      },
      categoryCard: {
        padding: '20px 15px',
        fontSize: '14px',
        minHeight: '80px',
      },
      childCard: {
        padding: '20px',
      },
      attendanceButton: {
        padding: '8px 20px',
        fontSize: '14px',
      },
    },
  };



const loadKidsInfo = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'students'));
    const allKids = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log("Fetched all kids:", allKids);
    setKids(allKids);
  } catch (error) {
    console.error('Error fetching all kids:', error);
  }
};



  // Load theme settings from Firebase.
  const loadThemesFromFirebase = async () => {
    try {
      const themeDocRef = doc(db, 'appConfig', 'themeOfTheWeek');
      const snapshot = await getDoc(themeDocRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.theme) {
          if (Array.isArray(data.theme)) {
            setThemeTags(data.theme);
          } else if (typeof data.theme === 'string') {
            setThemeTags(data.theme.split(',').map((tag) => tag.trim()));
          }
        }
        if (data.themeOfTheDay) {
          setDayThemes(data.themeOfTheDay);
        }
      }
    } catch (error) {
      console.error('Error loading themes from Firebase:', error);
    }
  };

 
  const fetchAttendance = async () => {
  console.log("📥 Fetching attendance...");
  try {
    const todayDateStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('date', '==', todayDateStr)
    );

    const snapshot = await getDocs(attendanceQuery);
    let tempAttendance = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.student_id && data.status) {
        tempAttendance[data.student_id] = {
          status: data.status,
          markedAt: new Date(), // Optional: replace with Firestore timestamp if available
          time: data.time_in
        };
      }
    });

    console.log("✅ Final attendanceData state:", tempAttendance);
    setAttendanceData(tempAttendance);
  } catch (error) {
    console.error("❌ Error fetching attendance:", error);
  }
};


  const fetchDailyReports = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const reportsQuery = query(
        collection(db, 'dailyReports'),
        where('date', '>=', startOfDay),
        where('date', '<', endOfDay)
      );
      const snapshot = await getDocs(reportsQuery);
      let reportsMapping = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.childName) {
          reportsMapping[data.childName] = { ...data, id: docSnap.id };
        }
      });
      setDailyReportsMapping(reportsMapping);
    } catch (error) {
      console.error('Error fetching daily reports:', error);
    }
  };

  // Automatically mark unmarked kids absent after 12pm
  useEffect(() => {
    if (!autoMarked) {
      const now = new Date();
      if (now.getHours() >= 12) {
        kids.forEach(kid => {
          if (!attendanceData[kid.student_id]) {
            markAttendance(kid.student_id, 'absent');
          }
        });
        setAutoMarked(true);
      }
    }
  }, [autoMarked, kids, attendanceData]);

  const handleMarkOutTime = async (kidName) => {
    const report = dailyReportsMapping[kidName];
    if (!report) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    try {
      const reportRef = doc(db, 'dailyReports', report.id);
      await updateDoc(reportRef, { outTime: formattedTime });

      // Update local state after successful write
      setDailyReportsMapping(prev => ({
        ...prev,
        [kidName]: { ...prev[kidName], outTime: formattedTime }
      }));
    } catch (error) {
      console.error('Error marking out time:', error);
      alert('Failed to update out time.');
    }
  };

  const handleKidClick = (kidName) => {
    const attendance = attendanceData[kidName];
    if (!attendance || attendance.status !== 'present') {
      alert(`Daily report can only be submitted if ${kidName} is marked Present.`);
      return;
    }
    if (dailyReportsMapping[kidName]) {
      alert(`Daily report for ${kidName} has already been submitted.`);
    } else {
      navigate(
        `/daily-report?child=${encodeURIComponent(kidName)}&themeOfTheDay=${encodeURIComponent(dayThemes.join(', '))}`
      );
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  /**
   * Mark or update attendance for a kid.
   * Clicking a button updates Firestore with the new status.
   */
  

const markAttendance = async (studentId, status) => {
  const now = new Date();
  const dateKey = now.toISOString().split("T")[0]; // "2025-07-03"
  const timeHHMM = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  // Set the doc ID as studentID + date
  const docId = `${studentId}_${dateKey}`;
  const attendanceRef = doc(db, 'attendance_records', docId);

  const attendanceData = {
    student_id: studentId,
    date: dateKey,
    status: status,
    time_in: status === 'present' ? timeHHMM : null,
    time_out: null,
    grade: ""
  };

  try {
    await setDoc(attendanceRef, attendanceData);
    console.log(`✅ Attendance marked: ${studentId} - ${status} at ${timeHHMM}`);
    // Update local state
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        status,
        time: timeHHMM,
        markedAt: now.toLocaleString('en-US')
      }
    }));
  } catch (error) {
    console.error('❌ Error marking attendance:', error);
    alert('Failed to mark attendance.');
  }
};


  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const getCurrentDate = () => {
    const now = new Date();
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    return now.toLocaleDateString('en-US', options);
  };

const progressPercentage = kids.length > 0 ? (presentCount / kids.length) * 100 : 0;


  // Sort kids: present first, then unmarked, then absent
  const sortedKids = [...kids].sort((a, b) => {
    const statusA = attendanceData[a.name]?.status;
    const statusB = attendanceData[b.name]?.status;
    if (statusA === 'present' && statusB !== 'present') return -1;
    if (statusA !== 'present' && statusB === 'present') return 1;
    if (statusA === 'absent' && statusB !== 'absent') return 1;
    if (statusA !== 'absent' && statusB === 'absent') return -1;
    return a.name.localeCompare(b.name);
  });

  const categoryCards = [
    { 
      title: 'Child Record', 
      color: '#5A68B1', 
      action: () => navigate('/child-data') 
    },
    { 
      title: 'Daily Updates', 
      color: '#E57C2F', 
      action: () => navigate(`/daily-report?themeOfTheDay=${encodeURIComponent(dayThemes.join(', '))}`) 
    },
    { 
      title: 'View Reports', 
      color: '#FFD33D', 
      action: () => navigate('/report') 
    },
    { 
      title: 'Theme', 
      color: '#C9A6FE', 
      action: () => navigate('/theme-management') 
    }
  ];

  useEffect(() => {
  const loadAllData = async () => {
    console.log("🔄 Starting full data load...");
    await loadKidsInfo();         // 🟢 load students first
    await fetchAttendance();      // 🟢 then attendance
    await fetchDailyReports();    // 🟢 then daily reports
    await loadThemesFromFirebase(); // optional but useful
  };

  loadAllData();
}, [location]);

  useEffect(() => {
  console.log('Kids data:', kids);
}, [kids]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img
            src={giraffeIcon}
            alt="Giraffe"
            style={styles.giraffeIcon}
          />
        </div>
        <div style={styles.headerRight} className="mobile-menu-container">
          {/* Desktop Logout Button */}
          <button
            onClick={handleLogout}
            style={{...styles.logoutButton, ...styles.desktopLogoutButton}}
          >
            Log Out
          </button>
          
          {/* Mobile Hamburger Menu */}
          <div style={styles.hamburgerMenu} onClick={toggleMobileMenu}>
            <div style={styles.hamburgerLine}></div>
            <div style={styles.hamburgerLine}></div>
            <div style={styles.hamburgerLine}></div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          <div style={styles.mobileMenuDropdown}>
            <button
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Day and Date Section */}
      <div style={styles.dayDateSection}>
        <h1 style={styles.dayTitle}>{getCurrentDay()}</h1>
        <div style={styles.dateContainer}>
          <svg style={styles.calendarIcon} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>{getCurrentDate()}</span>
        </div>
      </div>

      {/* Attendance Summary Card */}
      <div style={styles.attendanceCard}>
        <h3 style={styles.attendanceTitle}>Today Attendance</h3>
        <div style={styles.attendanceProgress}>
  {presentCount}/{kids.length} Present
</div>
<div style={{ fontSize: 14, color: "#fff", marginBottom: 8 }}>
  {absentCount} Absent
</div>

        <div style={styles.progressBarContainer}>
          <div
            style={{ ...styles.progressBar, width: `${progressPercentage}%` }}
          />
        </div>
        <div style={styles.themeRow}>
          <StarIcon /> Theme of the week: {themeTags.join(', ') || 'Animals'}
        </div>
      </div>

      {/* Category Section */}
      <h2 style={styles.categoryTitle}>Category :</h2>
      <div style={styles.categoryGrid}>
        {categoryCards.map((card, index) => (
          <div
            key={index}
            style={{
              ...styles.categoryCard,
              backgroundColor: card.color,
            }}
            onClick={card.action}
            onTouchStart={() => {}} 
          >
            {card.title}
          </div>
        ))}
      </div>

      {/* Children Record Section */}
      <h2 style={styles.childRecordTitle}>Children Record :</h2>
      <div style={styles.childrenContainer}>
        {sortedKids.map((kid, index) => {
          const currentStatus = attendanceData[kid.student_id]?.status;
          const presentButtonStyle = {
            ...styles.attendanceButton,
            ...(currentStatus === 'present' ? styles.presentButtonActive : styles.presentButton),
          };
          const absentButtonStyle = {
            ...styles.attendanceButton,
            ...(currentStatus === 'absent' ? styles.absentButtonActive : styles.absentButton),
          };

          return (
            <div key={kid.student_id} style={styles.childCard}>
              <div style={styles.childInfo}>
                <div 
                  style={{
                    ...styles.childAvatar,
                    // Use kid's photo if available, otherwise show initial
                    backgroundImage: kid.photo ? `url(${kid.photo})` : 'none',
                  }}
                >
                  {!kid.photo && kid.name.charAt(0).toUpperCase()}
                </div>
                <div style={styles.childDetails}>
                  <h4 
                    style={styles.childName}
                    onClick={() => handleKidClick(kid.name)}
                  >
                    {kid.name}
                    {dailyReportsMapping[kid.student_id] && (
                      <span style={styles.tickIcon}>✓</span>
                    )}
                  </h4>
                  <p style={styles.childId}>
                    {index + 1}/{kids.length}
                  </p>
                  {attendanceData[kid.student_id] && (
                    <div style={styles.timeStamp}>
                      Marked {currentStatus?.toUpperCase()} at {new Date(attendanceData[kid.student_id].markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                 {/*
                  attendanceData[kid.name]?.status === 'present' &&
                  dailyReportsMapping[kid.name] && (
                    <button
                      style={styles.outTimeButton}
                      onClick={() => handleMarkOutTime(kid.name)}
                    >
                      {dailyReportsMapping[kid.name].outTime || 'Out Time'}
                    </button>
                  )
                */}
                </div>
              </div>
              <div style={styles.attendanceButtons}>
                <button
                  style={presentButtonStyle}
                  disabled={currentStatus === 'present'}
                  onClick={() => markAttendance(kid.student_id, 'present')}
                >
                  Present
                </button>
                <button
                  style={absentButtonStyle}
                  disabled={currentStatus === 'absent'}
                  onClick={() => markAttendance(kid.student_id, 'absent')}
                >
                  Absent
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;