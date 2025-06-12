import React, { useMemo } from 'react';

const GMATTimeline = ({ onClose }) => {
  // Calculate current week based on timeline start date (June 9, 2025)
  const timelineData = useMemo(() => {
    const startDate = new Date('2025-06-09'); // Monday June 9, 2025 (W0 start)
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(diffDays / 7);
    
    return {
      currentWeek,
      startDate,
      today,
      isActive: diffDays >= 0 && diffDays < (17 * 7) // 17 weeks total (W0-W16)
    };
  }, []);

  const weeks = [
    // June 2025
    { week: 0, month: 'June 2025', dateRange: '9-15', type: 'current', milestone: 'Test Taken (Mon 9th)', milestoneType: 'decision' },
    { week: 1, month: 'June 2025', dateRange: '16-22', type: 'decision-point', milestone: 'Decision (Thu 19th)', milestoneType: 'decision' },
    { week: 2, month: 'June 2025', dateRange: '23-29', type: 'normal' },
    
    // July 2025
    { week: 3, month: 'July 2025', dateRange: '30-6', type: 'normal' },
    { week: 4, month: 'July 2025', dateRange: '7-13', type: 'key-date', milestone: 'Mock #4 (Sun 13th)', milestoneType: 'milestone' },
    { week: 5, month: 'July 2025', dateRange: '14-20', type: 'normal' },
    { week: 6, month: 'July 2025', dateRange: '21-27', type: 'normal' },
    { week: 7, month: 'July 2025', dateRange: '28-3', type: 'critical-date', milestone: 'Test Option 1', milestoneType: 'test-date' },
    
    // August 2025
    { week: 8, month: 'August 2025', dateRange: '4-10', type: 'key-date', milestone: 'Mock #5 (Sun 10th)', milestoneType: 'milestone' },
    { week: 9, month: 'August 2025', dateRange: '11-17', type: 'key-date', milestone: 'Mock #6 (Sun 17th)', milestoneType: 'milestone' },
    { week: 10, month: 'August 2025', dateRange: '18-24', type: 'normal' },
    { week: 11, month: 'August 2025', dateRange: '25-31', type: 'critical-date', milestone: 'Test Option 2', milestoneType: 'test-date' },
    
    // September-October 2025
    { week: 12, month: 'Sep-Oct 2025', dateRange: '1-7', type: 'key-date', milestone: 'Apps Open', milestoneType: 'milestone' },
    { week: 13, month: 'Sep-Oct 2025', dateRange: '8-14', type: 'normal' },
    { week: 14, month: 'Sep-Oct 2025', dateRange: '15-21', type: 'normal' },
    { week: 15, month: 'Sep-Oct 2025', dateRange: '22-28', type: 'normal' },
    { week: 16, month: 'Sep-Oct 2025', dateRange: '29-5', type: 'critical-date', milestone: 'Contract Ends', milestoneType: 'milestone' }
  ];

  const monthGroups = weeks.reduce((acc, week) => {
    if (!acc[week.month]) {
      acc[week.month] = [];
    }
    acc[week.month].push(week);
    return acc;
  }, {});

  const getWeekClass = (week) => {
    if (week.week === timelineData.currentWeek) {
      return 'current-week';
    }
    return week.type;
  };

  const formatCurrentStatus = () => {
    if (!timelineData.isActive) {
      if (timelineData.currentWeek < 0) {
        return `Timeline starts ${Math.abs(timelineData.currentWeek)} week(s) from now`;
      } else {
        return 'Timeline completed';
      }
    }
    
    const currentWeekData = weeks.find(w => w.week === timelineData.currentWeek);
    if (currentWeekData) {
      return `Currently in Week ${timelineData.currentWeek} (${currentWeekData.dateRange})`;
    }
    
    return `Week ${timelineData.currentWeek}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2c3e50, #3498db)',
          color: 'white',
          padding: '25px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '20px',
              top: '20px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ✕
          </button>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>
            GMAT Preparation Timeline
          </h1>
          <p style={{ margin: '0', fontSize: '16px', opacity: 0.9 }}>
            Strategic Planning: W0-W16 | Target: 675+ Focus Edition | {formatCurrentStatus()}
          </p>
        </div>

        {/* Calendar Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0
        }}>
          {Object.entries(monthGroups).map(([month, monthWeeks], monthIndex) => (
            <div key={month} style={{
              borderRight: monthIndex < Object.keys(monthGroups).length - 1 ? '1px solid #e9ecef' : 'none',
              minHeight: '400px'
            }}>
              <div style={{
                background: '#34495e',
                color: 'white',
                padding: '15px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '18px'
              }}>
                {month}
              </div>
              
              <div style={{ padding: '20px 15px' }}>
                {monthWeeks.map((week) => (
                  <div
                    key={week.week}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: getWeekClass(week) === 'current-week' ? '#e7f3ff' :
                                 getWeekClass(week) === 'decision-point' ? '#d1ecf1' :
                                 getWeekClass(week) === 'key-date' ? '#fff3cd' :
                                 getWeekClass(week) === 'critical-date' ? '#f8d7da' : '#f8f9fa',
                      borderLeft: `4px solid ${
                        getWeekClass(week) === 'current-week' ? '#0066cc' :
                        getWeekClass(week) === 'decision-point' ? '#17a2b8' :
                        getWeekClass(week) === 'key-date' ? '#ffc107' :
                        getWeekClass(week) === 'critical-date' ? '#dc3545' : '#dee2e6'
                      }`,
                      boxShadow: getWeekClass(week) === 'current-week' ? '0 2px 8px rgba(0,102,204,0.2)' : 'none',
                      fontWeight: getWeekClass(week) === 'critical-date' ? '600' : 'normal'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                        W{week.week}
                      </div>
                      <div style={{ color: '#6c757d', fontSize: '14px' }}>
                        {week.dateRange}
                      </div>
                    </div>
                    
                    {week.milestone && (
                      <span style={{
                        display: 'inline-block',
                        background: week.milestoneType === 'test-date' ? '#dc3545' :
                                   week.milestoneType === 'decision' ? '#17a2b8' : '#28a745',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        marginLeft: '8px'
                      }}>
                        {week.milestone}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{
          padding: '20px',
          background: '#f8f9fa',
          borderTop: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '16px' }}>
            Timeline Key
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <div style={{ width: '20px', height: '4px', marginRight: '10px', borderRadius: '2px', background: '#0066cc' }}></div>
              Current Week (W{timelineData.currentWeek})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <div style={{ width: '20px', height: '4px', marginRight: '10px', borderRadius: '2px', background: '#17a2b8' }}></div>
              Decision Point (W1: Thu June 19)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <div style={{ width: '20px', height: '4px', marginRight: '10px', borderRadius: '2px', background: '#dc3545' }}></div>
              Test Options (W7: July 28-Aug 3, W11: Aug 25-31)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <div style={{ width: '20px', height: '4px', marginRight: '10px', borderRadius: '2px', background: '#ffc107' }}></div>
              Official Mocks (#4, #5, #6) & Career Milestones
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GMATTimeline;