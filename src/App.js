import React, { useState, useEffect, useMemo, useCallback } from 'react';


// Try to import actual data, fallback to mock data
let questionData;
let warmupData;

try {
  questionData = require('./questionData.json');
} catch (error) {
  // Fallback mock data
  questionData = {
    sectionName: 'Practice Test - Development Mode',
    sectionType: 'quantitative',
    testDescription: 'This practice test covers quantitative reasoning and problem-solving.',
    skillsAssessed: ['Algebra and arithmetic', 'Geometry and coordinate geometry', 'Data analysis and probability'],
    adaptiveMode: true,
    targetQuestions: 21,
    timeLimit: 2700,
    questions: [
      {
        id: 1,
        questionText: 'If 3x + 7 = 22, what is the value of x?',
        difficulty: 'easy',
        options: { A: '3', B: '5', C: '7', D: '9', E: '11' },
        correctAnswer: 'B',
        buffer: false,
      },
      {
        id: 2,
        questionText: 'What is 15% of 240?',
        difficulty: 'medium',
        options: { A: '24', B: '30', C: '36', D: '42', E: '48' },
        correctAnswer: 'C',
        buffer: false,
      },
      {
        id: 3,
        questionText: 'If a² + b² = 25 and a + b = 7, what is ab?',
        difficulty: 'hard',
        options: { A: '10', B: '12', C: '14', D: '16', E: '18' },
        correctAnswer: 'B',
        buffer: false,
      },
    ],
  };
  console.log('Using fallback mock data - questionData.json not found');
}

try {
  warmupData = require('./warmupData.json');
} catch (error) {
  console.log('warmupData.json not found - warmup mode disabled');
  warmupData = null;
}

// Timeline Modal Component
const TimelineModal = ({ isVisible, onClose, questionTimes, adaptiveQuestions, testStartTime }) => {
  if (!isVisible) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      zIndex: 1002 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        maxWidth: '80%', 
        maxHeight: '80%', 
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)' 
      }}>
        <div style={{ 
          backgroundColor: '#3498db', 
          color: 'white', 
          padding: '14px 22px', 
          borderRadius: '8px 8px 0 0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ fontSize: '18px', fontWeight: '500' }}>Test Timeline</span>
          <button
            onClick={onClose}
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none', 
              color: 'white', 
              fontSize: '20px', 
              cursor: 'pointer', 
              padding: '2px 6px', 
              borderRadius: '3px' 
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Progress Timeline</h3>
            {testStartTime && (
              <p style={{ color: '#666', fontSize: '14px' }}>
                Test started: {testStartTime.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          {adaptiveQuestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {adaptiveQuestions.map((question, index) => (
                <div 
                  key={question.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    backgroundColor: questionTimes[question.id] ? '#f8f9fa' : '#fff',
                    border: questionTimes[question.id] ? '1px solid #e9ecef' : '1px solid #ddd',
                    borderRadius: '4px' 
                  }}
                >
                  <span style={{ 
                    minWidth: '40px', 
                    fontWeight: 'bold', 
                    color: '#2c3e50' 
                  }}>
                    Q{index + 1}
                  </span>
                  <span style={{ 
                    flex: 1, 
                    marginLeft: '12px', 
                    color: '#666' 
                  }}>
                    {questionTimes[question.id] 
                      ? `Completed in ${formatTime(questionTimes[question.id])}` 
                      : 'Not started'
                    }
                  </span>
                  {questionTimes[question.id] && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: questionTimes[question.id] > 150 ? '#f8d7da' : 
                                     questionTimes[question.id] < 60 ? '#d4edda' : '#fff3cd',
                      color: questionTimes[question.id] > 150 ? '#721c24' : 
                             questionTimes[question.id] < 60 ? '#155724' : '#856404'
                    }}>
                      {questionTimes[question.id] > 150 ? 'Slow' : 
                       questionTimes[question.id] < 60 ? 'Fast' : 'Normal'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {adaptiveQuestions.length === 0 && (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No timeline data available yet. Start the test to see your progress.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Timeline Button Component
const TimelineButton = ({ onClick, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
      ...style
    }}
    onMouseOver={(e) => (e.target.style.backgroundColor = '#5a6268')}
    onMouseOut={(e) => (e.target.style.backgroundColor = '#6c757d')}
  >
    📊 View Timeline
  </button>
);
// Add this Timeline component before your main GMATInterface component
const GMATPreparationTimeline = () => {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto 20px auto',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50, #3498db)',
        color: 'white',
        padding: '25px',
        textAlign: 'center'
      }}>
        <h1 style={{
          margin: '0 0 10px 0',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          GMAT Preparation Timeline
        </h1>
        <p style={{
          margin: '0',
          fontSize: '16px',
          opacity: '0.9'
        }}>
          Strategic Planning: W0-W16 | Target: 675+ Focus Edition | Current: Thursday, June 12 (W0)
        </p>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0'
      }}>
        {/* June 2025 */}
        <div style={{
          borderRight: '1px solid #e9ecef',
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
            June 2025
          </div>
          <div style={{ padding: '20px 15px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#e7f3ff',
              borderLeft: '4px solid #0066cc',
              boxShadow: '0 2px 8px rgba(0,102,204,0.2)'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W0</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>9-15</div>
              <span style={{
                background: '#17a2b8',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                Test Taken (Mon 9th)
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#d1ecf1',
              borderLeft: '4px solid #17a2b8'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W1</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>16-22</div>
              <span style={{
                background: '#17a2b8',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                Decision (Thu 19th)
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8f9fa',
              borderLeft: '4px solid #dee2e6'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W2</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>23-29</div>
            </div>
          </div>
        </div>
        
        {/* July 2025 */}
        <div style={{
          borderRight: '1px solid #e9ecef',
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
            July 2025
          </div>
          <div style={{ padding: '20px 15px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8f9fa',
              borderLeft: '4px solid #dee2e6'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W3</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>30-6</div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#fff3cd',
              borderLeft: '4px solid #ffc107'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W4</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>7-13</div>
              <span style={{
                background: '#28a745',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                Mock #4 (Sun 13th)
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8f9fa',
              borderLeft: '4px solid #dee2e6'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W5</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>14-20</div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8f9fa',
              borderLeft: '4px solid #dee2e6'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W6</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>21-27</div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8d7da',
              borderLeft: '4px solid #dc3545',
              fontWeight: '600'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W7</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>28-3</div>
              <span style={{
                background: '#dc3545',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                Test Option 1
              </span>
            </div>
          </div>
        </div>
        
        {/* August 2025 */}
        <div style={{
          borderRight: '1px solid #e9ecef',
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
            August 2025
          </div>
          <div style={{ padding: '20px 15px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#fff3cd',
              borderLeft: '4px solid #ffc107'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W8</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>4-10</div>
              <span style={{
                background: '#28a745',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                Mock #5 (Sun 10th)
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#fff3cd',
              borderLeft: '4px solid #ffc107'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W9</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>11-17</div>
              <span style={{
                background: '#28a745',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                Mock #6 (Sun 17th)
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8f9fa',
              borderLeft: '4px solid #dee2e6'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W10</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>18-24</div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8d7da',
              borderLeft: '4px solid #dc3545',
              fontWeight: '600'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W11</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>25-31</div>
              <span style={{
                background: '#dc3545',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                Test Option 2
              </span>
            </div>
          </div>
        </div>
        
        {/* September-October 2025 */}
        <div style={{ minHeight: '400px' }}>
          <div style={{
            background: '#34495e',
            color: 'white',
            padding: '15px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '18px'
          }}>
            Sep-Oct 2025
          </div>
          <div style={{ padding: '20px 15px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#fff3cd',
              borderLeft: '4px solid #ffc107'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W12</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>1-7</div>
              <span style={{
                background: '#28a745',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                Apps Open
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8f9fa',
              borderLeft: '4px solid #dee2e6'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W13</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>8-14</div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8f9fa',
              borderLeft: '4px solid #dee2e6'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W14</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>15-21</div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8f9fa',
              borderLeft: '4px solid #dee2e6'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W15</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>22-28</div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#f8d7da',
              borderLeft: '4px solid #dc3545',
              fontWeight: '600'
            }}>
              <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>W16</div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>29-5</div>
              <span style={{
                background: '#28a745',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                Contract Ends
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{
        padding: '20px',
        background: '#f8f9fa',
        borderTop: '1px solid #e9ecef'
      }}>
        <h3 style={{
          margin: '0 0 15px 0',
          color: '#495057',
          fontSize: '16px'
        }}>
          Timeline Key
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <div style={{
              width: '20px',
              height: '4px',
              marginRight: '10px',
              borderRadius: '2px',
              background: '#0066cc'
            }}></div>
            Current Week (W0: June 9-15)
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <div style={{
              width: '20px',
              height: '4px',
              marginRight: '10px',
              borderRadius: '2px',
              background: '#17a2b8'
            }}></div>
            Decision Point (W1: Thu June 19)
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <div style={{
              width: '20px',
              height: '4px',
              marginRight: '10px',
              borderRadius: '2px',
              background: '#dc3545'
            }}></div>
            Test Options (W7: July 28-Aug 3, W11: Aug 25-31)
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <div style={{
              width: '20px',
              height: '4px',
              marginRight: '10px',
              borderRadius: '2px',
              background: '#ffc107'
            }}></div>
            Official Mocks (#4, #5, #6) & Career Milestones
          </div>
        </div>
      </div>
    </div>
  );
};

const GMATInterface = () => {
  // Core state
  const [hasStarted, setHasStarted] = useState(false);
  const [isWarmupMode, setIsWarmupMode] = useState(false);
  const [warmupQuestionCount, setWarmupQuestionCount] = useState(10);
  const [customTimeLimit, setCustomTimeLimit] = useState(null);

  // Test execution state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Adaptive test state
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [performanceLevel, setPerformanceLevel] = useState('medium');

  // Timing state
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({});
  const [testStartTime, setTestStartTime] = useState(null);

  // Navigation state
  const [currentPassage, setCurrentPassage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [currentDataSource, setCurrentDataSource] = useState(null);

  // Bookmark and edit state
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());
  const [isReviewingBookmarks, setIsReviewingBookmarks] = useState(false);
  const [bookmarkReviewIndex, setBookmarkReviewIndex] = useState(0);
  const [editsUsed, setEditsUsed] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [isEditingPrevious, setIsEditingPrevious] = useState(false);
  const [editQuestionIndex, setEditQuestionIndex] = useState(0);
const [showEditModal, setShowEditModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Debug function
 const handleTimelineToggle = () => {
  console.log('Timeline button clicked, current state:', showTimeline);
  setShowTimeline(true);
  console.log('Timeline state should now be true');
};

// Auto-close timeline when test starts
useEffect(() => {
  if (hasStarted && !isCompleted && showTimeline) {
    setShowTimeline(false);
  }
}, [hasStarted, isCompleted, showTimeline]);
  // Inline Timeline Component
const renderTimeline = () => {
  // Calculate current week based on timeline start date (June 9, 2025)
  const startDate = new Date('2025-06-09'); // Monday June 9, 2025 (W0 start)
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentWeek = Math.floor(diffDays / 7);
  
  const weeks = [
    // June 2025
    { week: 0, month: 'June 2025', dateRange: '9-15', type: 'current', milestone: 'Test Taken (Mon 9th)', milestoneType: 'decision' },
{ week: 1, month: 'June 2025', dateRange: '16-22', type: 'decision-point', milestone: 'Anniversary Holiday', milestoneType: 'decision' },
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
    return week.week === currentWeek ? 'current-week' : week.type;
  };

  const formatCurrentStatus = () => {
    if (currentWeek < 0) {
      return `Timeline starts ${Math.abs(currentWeek)} week(s) from now`;
    } else if (currentWeek > 16) {
      return 'Timeline completed';
    }
    
    const currentWeekData = weeks.find(w => w.week === currentWeek);
    if (currentWeekData) {
      return `Currently in Week ${currentWeek} (${currentWeekData.dateRange})`;
    }
    
    return `Week ${currentWeek}`;
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
            onClick={() => setShowTimeline(false)}
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
background: getWeekClass(week) === 'current-week' ? '#fff3cd' :
                                 getWeekClass(week) === 'decision-point' ? '#d1ecf1' :
                                 getWeekClass(week) === 'key-date' ? '#fff3cd' :
                                 getWeekClass(week) === 'critical-date' ? '#f8d7da' : '#f8f9fa',
                     borderLeft: getWeekClass(week) === 'current-week' ? 'none' : `4px solid ${
                        getWeekClass(week) === 'decision-point' ? '#17a2b8' :
                        getWeekClass(week) === 'key-date' ? '#ffc107' :
                        getWeekClass(week) === 'critical-date' ? '#dc3545' : '#dee2e6'
                      }`,
                      border: getWeekClass(week) === 'current-week' ? '3px solid #ff6b35' : 'none',
                      boxShadow: getWeekClass(week) === 'current-week' ? '0 0 20px rgba(255,107,53,0.6), 0 0 40px rgba(255,107,53,0.3), inset 0 0 10px rgba(255,107,53,0.1)' : 'none',
                      fontWeight: getWeekClass(week) === 'critical-date' ? '600' : 'normal',
                      flexDirection: 'column',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
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
              <div style={{ width: '20px', height: '4px', marginRight: '10px', borderRadius: '2px', background: '#ff6b35' }}></div>
              Current Week (W{currentWeek})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <div style={{ width: '20px', height: '4px', marginRight: '10px', borderRadius: '2px', background: '#17a2b8' }}></div>
Anniversary Holiday (W1: June 16-22)
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

  // Computed values
  const currentData = useMemo(() => {
    return isWarmupMode && warmupData ? warmupData : questionData;
  }, [isWarmupMode]);

  const targetQuestions = useMemo(() => {
    return isWarmupMode ? warmupQuestionCount : currentData.targetQuestions || 21;
  }, [isWarmupMode, warmupQuestionCount, currentData.targetQuestions]);

  const maxEdits = useMemo(() => {
    return Math.floor(targetQuestions / 7) || 1;
  }, [targetQuestions]);

  const isDataInsights = currentData.sectionType === 'dataInsights';
  const isVerbal = currentData.sectionType === 'verbal';

  const defaultTimeLimit = useMemo(() => {
    if (isDataInsights) {
      return Math.round((45 * 60 * targetQuestions) / 20); // DI: 45 min for 20 questions
    } else if (isVerbal) {
      return Math.round((65 * 60 * targetQuestions) / 23); // Verbal: 65 min for 23 questions
    } else {
      return Math.round((45 * 60 * targetQuestions) / 21); // Quant: 45 min for 21 questions
    }
  }, [isDataInsights, isVerbal, targetQuestions]);

  const timeLimit = useMemo(() => {
    if (customTimeLimit !== null) {
      return customTimeLimit * 60;
    }

    // For warmup mode, always use calculated time based on question count, ignore JSON timeLimit
    if (isWarmupMode) {
      return defaultTimeLimit;
    }

    // For regular tests, use JSON timeLimit if available, otherwise use calculated default
    if (currentData.timeLimit) {
      return currentData.timeLimit;
    }
    return defaultTimeLimit;
  }, [customTimeLimit, currentData.timeLimit, defaultTimeLimit, isWarmupMode]);

  // Current question logic
  const getCurrentQuestion = useCallback(() => {
    if (isEditingPrevious) {
      return adaptiveQuestions[editQuestionIndex];
    }
    if (isReviewingBookmarks) {
      const bookmarkArray = Array.from(bookmarkedQuestions).map((id) => adaptiveQuestions.find((q) => q.id === id));
      return bookmarkArray[bookmarkReviewIndex];
    }
    return adaptiveQuestions[currentQuestionIndex];
  }, [
    isEditingPrevious,
    editQuestionIndex,
    isReviewingBookmarks,
    bookmarkedQuestions,
    bookmarkReviewIndex,
    adaptiveQuestions,
    currentQuestionIndex,
  ]);

  const currentQuestion = useMemo(() => getCurrentQuestion(), [getCurrentQuestion]);

  // Initialize timeRemaining when timeLimit changes
  useEffect(() => {
    if (!hasStarted) {
      setTimeRemaining(timeLimit);
    }
  }, [timeLimit, hasStarted]);

  // Timer effect
  useEffect(() => {
    if (hasStarted && !isPaused && !isCompleted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    if (hasStarted && timeRemaining <= 0 && !isCompleted) {
      setIsCompleted(true);
    }
  }, [hasStarted, isPaused, isCompleted, timeRemaining]);

  // Show time warning when 1/9th of time remains
  useEffect(() => {
    const warningTime = timeLimit / 9;
    if (timeRemaining === Math.floor(warningTime)) {
      setShowTimeWarning(true);
    }
  }, [timeRemaining, timeLimit]);

  // Update current data source when question changes
  useEffect(() => {
    if (adaptiveQuestions.length > 0 && currentQuestion) {
      if (isDataInsights) {
        const dataSource = currentData.dataSources?.find((ds) => ds.id === currentQuestion.dataSourceId);
        setCurrentDataSource(dataSource);
        setActiveTab(0);
      } else if (isVerbal && currentQuestion.passageId) {
        const passage = currentData.passages?.find((p) => p.id === currentQuestion.passageId);
        setCurrentPassage(passage);
      }
    }
  }, [currentQuestion, isDataInsights, isVerbal, adaptiveQuestions.length, currentData]);

  // Question timing effect
  useEffect(() => {
    if (hasStarted && !isPaused && !isCompleted && currentQuestion) {
      setQuestionStartTime(Date.now());
      return () => setQuestionStartTime(null);
    }
  }, [
    currentQuestionIndex,
    isEditingPrevious,
    isReviewingBookmarks,
    hasStarted,
    isPaused,
    isCompleted,
    bookmarkReviewIndex,
    editQuestionIndex,
  ]);

  // Question initialization
  const initializeAdaptiveQuestions = useCallback(() => {
    const questionsPool = currentData.questions || [];

    if (isWarmupMode) {
      // For warmup mode, shuffle questions and take the requested count
      const shuffledQuestions = shuffleArray([...questionsPool]); // Create copy and shuffle
      const selectedQuestions = shuffledQuestions.slice(0, warmupQuestionCount);
      setAdaptiveQuestions(selectedQuestions);
      return;
    }

    if (currentData.adaptiveMode) {
      const allQuestions = questionsPool.filter((q) => !q.buffer);
      const bufferQuestions = questionsPool.filter((q) => q.buffer);

      // Group questions by passage for verbal sections
      if (isVerbal) {
        const passageGroups = {};
        const crQuestions = [];

        allQuestions.forEach((q) => {
          if (q.passageId) {
            if (!passageGroups[q.passageId]) {
              passageGroups[q.passageId] = [];
            }
            passageGroups[q.passageId].push(q);
          } else {
            crQuestions.push(q);
          }
        });

        const questionsToUse = [];
        const passageGroupArrays = Object.values(passageGroups);

        let crIndex = 0;
        passageGroupArrays.forEach((passageGroup, index) => {
          questionsToUse.push(...passageGroup);
          if (crIndex < crQuestions.length && index < passageGroupArrays.length - 1) {
            questionsToUse.push(crQuestions[crIndex]);
            crIndex++;
          }
        });

        while (crIndex < crQuestions.length) {
          questionsToUse.push(crQuestions[crIndex]);
          crIndex++;
        }

        setAdaptiveQuestions(questionsToUse.slice(0, targetQuestions));
      } else {
        // Original logic for non-verbal sections
        const questionsByDifficulty = {
          easy: [...allQuestions.filter((q) => q.difficulty === 'easy')],
          medium: [...allQuestions.filter((q) => q.difficulty === 'medium')],
          hard: [...allQuestions.filter((q) => q.difficulty === 'hard')],
        };

        bufferQuestions.forEach((q) => {
          if (questionsByDifficulty[q.difficulty]) {
            questionsByDifficulty[q.difficulty].push(q);
          }
        });

        Object.keys(questionsByDifficulty).forEach((difficulty) => {
          questionsByDifficulty[difficulty] = shuffleArray(questionsByDifficulty[difficulty]);
        });

        const difficultyPattern = createAdaptiveDifficultyPattern(targetQuestions);
        const questionsToUse = [];
        const usedQuestionIds = new Set();

        for (let i = 0; i < difficultyPattern.length; i++) {
          const targetDifficulty = difficultyPattern[i];
          let selectedQuestion = null;

          const pool = questionsByDifficulty[targetDifficulty];
          if (pool && pool.length > 0) {
            selectedQuestion = pool.find((q) => !usedQuestionIds.has(q.id));
          }

          if (!selectedQuestion) {
            const fallbackOrder =
              targetDifficulty === 'easy'
                ? ['medium', 'hard']
                : targetDifficulty === 'medium'
                ? ['easy', 'hard']
                : ['medium', 'easy'];

            for (const fallbackDiff of fallbackOrder) {
              const fallbackPool = questionsByDifficulty[fallbackDiff];
              if (fallbackPool && fallbackPool.length > 0) {
                selectedQuestion = fallbackPool.find((q) => !usedQuestionIds.has(q.id));
                if (selectedQuestion) break;
              }
            }
          }

          if (selectedQuestion) {
            questionsToUse.push(selectedQuestion);
            usedQuestionIds.add(selectedQuestion.id);
          }
        }

        setAdaptiveQuestions(questionsToUse);
      }
    } else {
      const questionsToUse = questionsPool.slice(0, targetQuestions);
      setAdaptiveQuestions(questionsToUse);
    }
  }, [targetQuestions, isVerbal, isWarmupMode, warmupQuestionCount, currentData]);

  // Helper functions
  const createAdaptiveDifficultyPattern = useCallback((numQuestions) => {
    const pattern = ['medium'];

    for (let i = 1; i < numQuestions; i++) {
      const position = i / numQuestions;

      if (position < 0.3) {
        const rand = Math.random();
        if (rand < 0.4) pattern.push('easy');
        else if (rand < 0.8) pattern.push('medium');
        else pattern.push('hard');
      } else if (position < 0.7) {
        const rand = Math.random();
        if (rand < 0.3) pattern.push('easy');
        else if (rand < 0.6) pattern.push('medium');
        else pattern.push('hard');
      } else {
        const rand = Math.random();
        if (rand < 0.2) pattern.push('easy');
        else if (rand < 0.5) pattern.push('medium');
        else pattern.push('hard');
      }
    }

    return pattern;
  }, []);

  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const updatePerformanceLevel = useCallback(() => {
    if (!currentData.adaptiveMode || currentQuestionIndex < 3) return;

    const recentQuestions = Math.min(5, currentQuestionIndex);
    const startIndex = Math.max(0, currentQuestionIndex - recentQuestions);
    let correctCount = 0;

    for (let i = startIndex; i < currentQuestionIndex; i++) {
      const question = adaptiveQuestions[i];
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    }

    const recentAccuracy = correctCount / recentQuestions;

    if (recentAccuracy >= 0.8) {
      setPerformanceLevel('hard');
    } else if (recentAccuracy >= 0.6) {
      setPerformanceLevel('medium');
    } else {
      setPerformanceLevel('easy');
    }
  }, [currentQuestionIndex, adaptiveQuestions, selectedAnswers, currentData.adaptiveMode]);

  // Utility functions
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Enhanced formatMath function - replace your existing one
  const formatMath = useCallback((text) => {
    if (!text) return '';
    const textStr = typeof text === 'string' ? text : String(text);

    return (
      textStr
        // Handle fractions like 53/6,000 or 1/x
        .replace(/(\d+)\/(\d+(?:,\d+)*)/g, '<span style="font-size: 1.1em;"><sup>$1</sup>⁄<sub>$2</sub></span>')
        .replace(/(\w+)\/(\w+)/g, '<span style="font-size: 1.1em;"><sup>$1</sup>⁄<sub>$2</sub></span>')

        // Handle explicit superscripts: x^2, x^{n-1}, etc.
        .replace(/\^(\{[^}]+\})/g, '<sup>$1</sup>')
        .replace(/\^(\([^)]+\))/g, '<sup>$1</sup>')
        .replace(/\^(\d+)/g, '<sup>$1</sup>')
        .replace(/\^(\w+)/g, '<sup>$1</sup>')

        // Handle explicit subscripts: t_n, H_2O, etc.
        .replace(/_(\{[^}]+\})/g, '<sub>$1</sub>')
        .replace(/_(\([^)]+\))/g, '<sub>$1</sub>')
        .replace(/_(\d+)/g, '<sub>$1</sub>')
        .replace(/_(\w+)/g, '<sub>$1</sub>')

        // Handle Unicode subscripts and superscripts (like from your JSON)
        .replace(/([ₙₘᵢⱼₖₗ₁₂₃₄₅₆₇₈₉₀]+)/g, '<sub>$1</sub>')
        .replace(/([ⁿᵐⁱʲᵏˡ¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g, '<sup>$1</sup>')

        // Handle square roots
        .replace(/sqrt\(([^)]+)\)/g, '√($1)')
        .replace(
          /√\(([^)]+)\)/g,
          '<span style="font-size: 1.2em;">√</span><span style="text-decoration: overline;">$1</span>'
        )

        // Handle mathematical operators and symbols
        .replace(/\*\*/g, '×')
        .replace(/\+\-/g, '±')
        .replace(/!=/g, '≠')
        .replace(/<=/g, '≤')
        .replace(/>=/g, '≥')
        .replace(/degrees?/g, '°')
        .replace(/infinity/g, '∞')
        .replace(/pi/g, 'π')
        .replace(/theta/g, 'θ')
        .replace(/alpha/g, 'α')
        .replace(/beta/g, 'β')
        .replace(/gamma/g, 'γ')

        // Handle function notation like f(x), f(1/x)
        .replace(/f\(([^)]+)\)/g, '<em>f</em>(<em>$1</em>)')
        .replace(/g\(([^)]+)\)/g, '<em>g</em>(<em>$1</em>)')
        .replace(/h\(([^)]+)\)/g, '<em>h</em>(<em>$1</em>)')

        // Handle absolute value bars
        .replace(/\|([^|]+)\|/g, '|<em>$1</em>|')

        // Handle special mathematical expressions
        .replace(/(\d+),(\d+)/g, '$1,$2') // Keep commas in numbers

        // Clean up any stray brackets from replacements
        .replace(/\{([^}]+)\}/g, '$1')
        .replace(/\\([a-zA-Z]+)/g, '$1')
    ); // Remove LaTeX-style backslashes
  }, []);

  // Render reading passages with line numbering
  const renderPassage = useCallback((passage) => {
    if (!passage) return null;

    const lines = passage.content.split('\n').filter((line) => line.trim() !== '');

    return (
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '6px',
          border: '1px solid #dee2e6',
          height: 'fit-content',
          maxHeight: 'calc(100vh - 200px)',
          overflow: 'auto',
        }}
      >
        {passage.title && (
          <h3
            style={{
              color: '#2c3e50',
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center',
              borderBottom: '2px solid #e9ecef',
              paddingBottom: '10px',
            }}
          >
            {passage.title}
          </h3>
        )}
        <div
          style={{
            lineHeight: '1.8',
            fontSize: '16px',
            color: '#2c3e50',
            fontFamily: 'Georgia, serif',
          }}
        >
          {lines.map((line, index) => (
            <div
              key={index}
              style={{
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  color: '#6c757d',
                  fontSize: '14px',
                  fontWeight: '500',
                  minWidth: '25px',
                  marginRight: '12px',
                  marginTop: '2px',
                  userSelect: 'none',
                }}
              >
                {index + 1}
              </span>
              <span style={{ flex: 1 }}>{line.trim()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }, []);

  // Format Roman numeral questions to display on separate lines
  const formatRomanNumerals = useCallback((text) => {
    if (!text) return '';

    // Check if the text contains Roman numerals pattern
    const romanNumeralPattern = /\b(I\.|II\.|III\.|IV\.|V\.)\s*/g;

    if (romanNumeralPattern.test(text)) {
      return (
        text
          // Add line breaks before Roman numerals (except the first one)
          .replace(/\s+(I\.|II\.|III\.|IV\.|V\.)/g, '<br><br>$1')
          // Clean up any double spacing
          .replace(/\s+/g, ' ')
          .trim()
      );
    }

    return text;
  }, []);

  // Event handlers
  const startTest = useCallback(() => {
    setTimeRemaining(timeLimit);
    setHasStarted(true);
    setTestStartTime(new Date());
    initializeAdaptiveQuestions();
  }, [initializeAdaptiveQuestions, timeLimit]);

  const handleAnswerSelect = useCallback((questionId, answer) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setAnsweredQuestions((prev) => new Set([...prev, questionId]));
  }, []);

  const isQuestionAnswered = useCallback(
    (question) => {
      if (!question) return false;
      return selectedAnswers[question.id] !== undefined;
    },
    [selectedAnswers]
  );

  const handleNext = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const confirmNext = useCallback(() => {
    setShowConfirmModal(false);

    // Record time spent on current question
    if (questionStartTime && currentQuestion) {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      setQuestionTimes((prev) => ({ ...prev, [currentQuestion.id]: timeSpent }));
    }

    if (currentData.adaptiveMode && !isWarmupMode) {
      updatePerformanceLevel();
    }

    if (isReviewingBookmarks) {
      const bookmarkArray = Array.from(bookmarkedQuestions);
      if (bookmarkReviewIndex < bookmarkArray.length - 1) {
        setBookmarkReviewIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
      }
    } else {
      if (currentQuestionIndex < adaptiveQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        if (bookmarkedQuestions.size > 0 && timeRemaining > 0) {
          setIsReviewingBookmarks(true);
          setBookmarkReviewIndex(0);
        } else {
          setIsCompleted(true);
        }
      }
    }
  }, [
    questionStartTime,
    currentQuestion,
    updatePerformanceLevel,
    isReviewingBookmarks,
    bookmarkedQuestions,
    bookmarkReviewIndex,
    currentQuestionIndex,
    adaptiveQuestions.length,
    timeRemaining,
    currentData.adaptiveMode,
    isWarmupMode,
  ]);

  const cancelNext = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const toggleBookmark = useCallback((questionId) => {
    setBookmarkedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  // Visual Elements Renderer for questions
  const renderQuestionVisual = useCallback(
    (visual) => {
      if (!visual) return null;

      const { type, content, data, title } = visual;

      switch (type) {
        case 'table':
          return (
            <div
              style={{
                marginBottom: '20px',
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
              }}
            >
              {title && (
                <h5
                  style={{
                    color: '#2c3e50',
                    marginBottom: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {title}
                </h5>
              )}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {data.headers && (
                  <thead style={{ backgroundColor: '#e9ecef' }}>
                    <tr>
                      {data.headers.map((header, index) => (
                        <th
                          key={index}
                          style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#495057',
                            borderBottom: '2px solid #dee2e6',
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {data.rows &&
                    data.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        style={{
                          backgroundColor: rowIndex % 2 === 0 ? 'white' : '#f8f9fa',
                        }}
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                              borderBottom: '1px solid #dee2e6',
                              color: '#495057',
                            }}
                          >
                            <span dangerouslySetInnerHTML={{ __html: formatMath(cell) }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );

        case 'diagram':
          return (
            <div
              style={{
                marginBottom: '20px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
              }}
            >
              {title && (
                <h5
                  style={{
                    color: '#2c3e50',
                    marginBottom: '15px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {title}
                </h5>
              )}
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {content && content.includes('Number line') ? (
                  // Render number line
                  <svg width="400" height="60" style={{ maxWidth: '100%' }}>
                    {/* Number line base */}
                    <line x1="40" y1="30" x2="360" y2="30" stroke="#333" strokeWidth="2" />

                    {/* Tick marks and numbers */}
                    {[-8, -6, -4, -2, 0, 2, 4, 6, 8].map((num, index) => {
                      const x = 40 + index * 40;
                      return (
                        <g key={num}>
                          <line x1={x} y1="25" x2={x} y2="35" stroke="#333" strokeWidth="1" />
                          <text x={x} y="50" textAnchor="middle" fontSize="12" fill="#333">
                            {num}
                          </text>
                        </g>
                      );
                    })}

                    {/* Shaded interval example (from -4 to 8) */}
                    {content.includes('shaded interval from -4 to 8') && (
                      <line x1="120" y1="30" x2="320" y2="30" stroke="#e74c3c" strokeWidth="6" opacity="0.7" />
                    )}
                  </svg>
                ) : (
                  // Generic diagram placeholder
                  <div
                    style={{
                      minHeight: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f8f9fa',
                      border: '2px dashed #dee2e6',
                      borderRadius: '4px',
                      color: '#6c757d',
                      fontSize: '14px',
                    }}
                  >
                    📊 {content || 'Diagram'}
                  </div>
                )}
              </div>
            </div>
          );

        case 'equation':
          return (
            <div
              style={{
                marginBottom: '20px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
              }}
            >
              {title && (
                <h5
                  style={{
                    color: '#2c3e50',
                    marginBottom: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {title}
                </h5>
              )}
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '4px',
                  fontSize: '20px',
                  fontFamily: 'Times New Roman, serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  lineHeight: '1.8',
                }}
              >
                {content.split('\n').map((equation, index) => (
                  <div key={index} style={{ marginBottom: index < content.split('\n').length - 1 ? '10px' : '0' }}>
                    <span dangerouslySetInnerHTML={{ __html: formatMath(equation.trim()) }} />
                  </div>
                ))}
              </div>
            </div>
          );

        default:
          return (
            <div
              style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                textAlign: 'center',
                color: '#6c757d',
              }}
            >
              📊 Visual Element: {type}
              {content && <div style={{ marginTop: '10px', fontSize: '14px' }}>{content}</div>}
            </div>
          );
      }
    },
    [formatMath]
  );

  // Time Pressure Graph Component
  const renderTimePressureGraph = useCallback(() => {
    if (adaptiveQuestions.length === 0) return null;

    const graphWidth = 600;
    const graphHeight = 300;
    const padding = 60;
    const innerWidth = graphWidth - padding * 2;
    const innerHeight = graphHeight - padding * 2;

    // Calculate time data with results
    const timeData = adaptiveQuestions.map((question, index) => ({
      questionNum: index + 1,
      timeSpent: (questionTimes[question.id] || 0) / 60, // Convert to minutes
      isCorrect: selectedAnswers[question.id] === question.correctAnswer,
      wasAnswered: selectedAnswers[question.id] !== undefined,
    }));

    const maxTime = Math.max(...timeData.map((d) => d.timeSpent), 5); // At least 5 minutes scale
    const avgTime = timeData.reduce((sum, d) => sum + d.timeSpent, 0) / timeData.length;

    // Create points for the scatter plot
    const points = timeData.map((data, index) => {
      const x = padding + (index / (timeData.length - 1)) * innerWidth;
      const y = padding + (1 - data.timeSpent / maxTime) * innerHeight;
      return { x, y, ...data };
    });

    return (
      <div style={{ marginBottom: '25px', textAlign: 'center' }}>
        <h4 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px' }}>Time Pressure Analysis</h4>

        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
          }}
        >
          <svg width={graphWidth} height={graphHeight} style={{ backgroundColor: 'white', borderRadius: '4px' }}>
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f0f0f0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={graphWidth} height={graphHeight} fill="url(#grid)" />

            {/* Axes */}
            <line x1={padding} y1={padding} x2={padding} y2={graphHeight - padding} stroke="#666" strokeWidth="2" />
            <line
              x1={padding}
              y1={graphHeight - padding}
              x2={graphWidth - padding}
              y2={graphHeight - padding}
              stroke="#666"
              strokeWidth="2"
            />

            {/* Y-axis labels (time in minutes) */}
            {[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((minutes) => {
              const y = padding + (1 - minutes / maxTime) * innerHeight;
              if (y >= padding && y <= graphHeight - padding) {
                return (
                  <g key={minutes}>
                    <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="#666" strokeWidth="1" />
                    <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#666">
                      {minutes.toFixed(1)}
                    </text>
                  </g>
                );
              }
              return null;
            })}

            {/* Y-axis title */}
            <text
              x={20}
              y={graphHeight / 2}
              textAnchor="middle"
              fontSize="14"
              fill="#666"
              transform={`rotate(-90, 20, ${graphHeight / 2})`}
            >
              Response Time in Minutes
            </text>

            {/* X-axis labels (questions) */}
            {points
              .filter((_, i) => i % 2 === 0 || i === points.length - 1)
              .map((point) => (
                <g key={point.questionNum}>
                  <line
                    x1={point.x}
                    y1={graphHeight - padding}
                    x2={point.x}
                    y2={graphHeight - padding + 5}
                    stroke="#666"
                    strokeWidth="1"
                  />
                  <text x={point.x} y={graphHeight - padding + 18} textAnchor="middle" fontSize="12" fill="#666">
                    {point.questionNum}
                  </text>
                </g>
              ))}

            {/* X-axis title */}
            <text x={graphWidth / 2} y={graphHeight - 10} textAnchor="middle" fontSize="14" fill="#666">
              Question Number
            </text>

            {/* Average time line */}
            <line
              x1={padding}
              y1={padding + (1 - avgTime / maxTime) * innerHeight}
              x2={graphWidth - padding}
              y2={padding + (1 - avgTime / maxTime) * innerHeight}
              stroke="#888"
              strokeWidth="2"
            />
            <text
              x={graphWidth - padding - 5}
              y={padding + (1 - avgTime / maxTime) * innerHeight - 5}
              textAnchor="end"
              fontSize="12"
              fill="#888"
              fontWeight="bold"
            >
              Your Average
            </text>

            {/* Data points with correct/incorrect indicators */}
            {points.map((point, index) => {
              if (!point.wasAnswered) {
                // Gray circle for unanswered
                return (
                  <circle key={index} cx={point.x} cy={point.y} r="8" fill="#888" stroke="white" strokeWidth="2" />
                );
              } else if (point.isCorrect) {
                // Green checkmark for correct
                return (
                  <g key={index}>
                    <circle cx={point.x} cy={point.y} r="12" fill="#27ae60" stroke="white" strokeWidth="2" />
                    <path
                      d={`M ${point.x - 6} ${point.y} L ${point.x - 2} ${point.y + 4} L ${point.x + 6} ${point.y - 4}`}
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                );
              } else {
                // Red X for incorrect
                return (
                  <g key={index}>
                    <circle cx={point.x} cy={point.y} r="12" fill="#e74c3c" stroke="white" strokeWidth="2" />
                    <path
                      d={`M ${point.x - 5} ${point.y - 5} L ${point.x + 5} ${point.y + 5} M ${point.x + 5} ${
                        point.y - 5
                      } L ${point.x - 5} ${point.y + 5}`}
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                );
              }
            })}
          </svg>

          {/* Legend */}
          <div
            style={{
              marginTop: '15px',
              fontSize: '14px',
              color: '#666',
              display: 'flex',
              justifyContent: 'center',
              gap: '30px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#27ae60',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                ✓
              </div>
              Correctly Answered
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#e74c3c',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                ✗
              </div>
              Incorrectly Answered
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#888',
                  borderRadius: '50%',
                }}
              ></div>
              Not Answered
            </span>
          </div>
        </div>
      </div>
    );
  }, [adaptiveQuestions, questionTimes, selectedAnswers, formatTime]);

  const calculateScore = useCallback(() => {
    let totalPoints = 0;
    let maxPossiblePoints = 0;
    let correctByDifficulty = { easy: 0, medium: 0, hard: 0 };
    let totalByDifficulty = { easy: 0, medium: 0, hard: 0 };

    const isQuestionCorrect = (question) => {
      return selectedAnswers[question.id] === question.correctAnswer;
    };

    if (currentData.adaptiveMode && !isWarmupMode) {
      const pointValues = { easy: 1, medium: 2.5, hard: 4 };
      const firstSevenBonus = 1.2;

      adaptiveQuestions.forEach((question, index) => {
        const difficulty = question.difficulty;
        let points = pointValues[difficulty];

        if (index < 7) {
          points *= firstSevenBonus;
        }

        totalByDifficulty[difficulty]++;
        maxPossiblePoints += points;

        if (isQuestionCorrect(question)) {
          correctByDifficulty[difficulty]++;
          totalPoints += points;
        }
      });

      const rawPercentage = totalPoints / maxPossiblePoints;
      let scalingFactor = 1.0;
      if (performanceLevel === 'hard') scalingFactor = 1.1;
      else if (performanceLevel === 'easy') scalingFactor = 0.9;

      const adjustedPercentage = Math.min(rawPercentage * scalingFactor, 1.0);
      const gmatScore = Math.round(60 + adjustedPercentage * 30);

      return {
        gmatScore,
        accuracyPercentage: Math.round(
          (Object.values(correctByDifficulty).reduce((a, b) => a + b, 0) / adaptiveQuestions.length) * 100
        ),
        totalPoints: Math.round(totalPoints),
        maxPossiblePoints: Math.round(maxPossiblePoints),
        correctByDifficulty,
        totalByDifficulty,
        totalCorrect: Object.values(correctByDifficulty).reduce((a, b) => a + b, 0),
        totalQuestions: adaptiveQuestions.length,
        performanceLevel,
      };
    } else {
      // Simple scoring for warmup mode or non-adaptive tests
      const pointValues = { easy: 1, medium: 2, hard: 3 };

      adaptiveQuestions.forEach((question) => {
        const difficulty = question.difficulty;
        const points = pointValues[difficulty];

        totalByDifficulty[difficulty]++;
        maxPossiblePoints += points;

        if (isQuestionCorrect(question)) {
          correctByDifficulty[difficulty]++;
          totalPoints += points;
        }
      });

      const rawPercentage = totalPoints / maxPossiblePoints;
      const gmatScore = Math.round(60 + rawPercentage * 30);

      return {
        gmatScore,
        accuracyPercentage: Math.round(
          (Object.values(correctByDifficulty).reduce((a, b) => a + b, 0) / adaptiveQuestions.length) * 100
        ),
        totalPoints: Math.round(totalPoints),
        maxPossiblePoints: Math.round(maxPossiblePoints),
        correctByDifficulty,
        totalByDifficulty,
        totalCorrect: Object.values(correctByDifficulty).reduce((a, b) => a + b, 0),
        totalQuestions: adaptiveQuestions.length,
        performanceLevel: isWarmupMode ? 'Warmup' : 'N/A',
      };
    }
  }, [adaptiveQuestions, selectedAnswers, performanceLevel, currentData.adaptiveMode, isWarmupMode]);

  const isTimeWarning = timeRemaining <= timeLimit / 9;

  // Loading states and error handling
  if (hasStarted && adaptiveQuestions.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'Arial, sans-serif',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '20px', color: '#3498db', marginBottom: '10px' }}>
            {isWarmupMode ? 'Initializing Warmup Questions...' : 'Initializing Adaptive Test...'}
          </div>
          <div style={{ fontSize: '16px', color: '#666' }}>
            {isWarmupMode ? 'Preparing your warmup questions' : 'Setting up questions based on your profile'}
          </div>
        </div>
      </div>
    );
  }

  if (hasStarted && (!currentQuestion || (!isReviewingBookmarks && currentQuestionIndex >= adaptiveQuestions.length))) {
    return (
      <div
        style={{
          fontFamily: 'Arial, sans-serif',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '20px', color: '#e74c3c', marginBottom: '10px' }}>Test Error</div>
          <div style={{ fontSize: '16px', color: '#666' }}>Unable to load question. Please restart the test.</div>
        </div>
      </div>
    );
  }

  // Start screen
  if (!hasStarted) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            backgroundColor: '#2c3e50',
            color: 'white',
            padding: '14px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            GMAT™ Practice Test -{' '}
            {isDataInsights ? 'Data Insights' : isVerbal ? 'Verbal Reasoning' : 'Quantitative Reasoning'}
            {questionData.sectionName.includes('Development Mode') && (
              <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
            )}
          </span>
          <span style={{ fontSize: '16px' }}>Ready to Begin</span>
        </div>

        <div
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            padding: '10px 22px',
            fontSize: '16px',
            fontWeight: '500',
          }}
        >
          {currentData.sectionName}
        </div>

        <div
          style={{
            flex: 1,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center',
              maxWidth: '700px',
            }}
          >
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '24px' }}>
              {currentData.sectionName}
              {questionData.sectionName.includes('Development Mode') && (
                <div style={{ fontSize: '16px', color: '#e74c3c', marginTop: '5px' }}>
                  (Using fallback data - questionData.json not found)
                </div>
              )}
            </h2>

            {/* Mode Selection */}
            {warmupData && (
              <div
                style={{
                  backgroundColor: '#e8f4fd',
                  padding: '20px',
                  borderRadius: '6px',
                  marginBottom: '25px',
                  border: '2px solid #3498db',
                }}
              >
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px', textAlign: 'center' }}>
                  Test Mode Selection
                </h3>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="testMode"
                      checked={!isWarmupMode}
                      onChange={() => setIsWarmupMode(false)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>Test Mode</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="testMode"
                      checked={isWarmupMode}
                      onChange={() => setIsWarmupMode(true)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>Warmup Mode</span>
                  </label>
                </div>

                {isWarmupMode && (
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                      <span style={{ fontSize: '16px' }}>Number of questions:</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={warmupQuestionCount}
                        onChange={(e) => setWarmupQuestionCount(parseInt(e.target.value) || 10)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          width: '80px',
                          fontSize: '16px',
                          textAlign: 'center',
                        }}
                      />
                    </label>
                    <div style={{ fontSize: '14px', color: '#888', marginTop: '5px' }}>
                      Choose 1-50 questions for practice
                    </div>
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: '25px',
                borderRadius: '6px',
                marginBottom: '25px',
                textAlign: 'left',
              }}
            >
              <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px', textAlign: 'center' }}>
                What This Test Covers
              </h3>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '15px', lineHeight: '1.6' }}>
                {currentData.testDescription ||
                  `This section tests your ${
                    isDataInsights ? 'data analysis and interpretation' : 'quantitative reasoning'
                  } abilities.`}
              </div>
              {currentData.skillsAssessed && currentData.skillsAssessed.length > 0 && (
                <div>
                  <strong style={{ color: '#2c3e50', fontSize: '16px' }}>Skills Assessed:</strong>
                  <ul
                    style={{
                      marginTop: '8px',
                      paddingLeft: '20px',
                      fontSize: '16px',
                      color: '#666',
                      lineHeight: '1.6',
                    }}
                  >
                    {currentData.skillsAssessed.map((skill, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Navigation Tabs */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
                <button
                  onClick={handleTimelineToggle}
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
                >
                  📅 View Timeline
                </button>
              </div>
            </div>

            <div style={{ fontSize: '18px', color: '#666', marginBottom: '25px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Time Limit:</strong>
                <div
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    justifyContent: 'center',
                  }}
                >
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customTimeLimit !== null ? customTimeLimit : Math.floor(defaultTimeLimit / 60)}
                    onChange={(e) => setCustomTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      width: '80px',
                      fontSize: '16px',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: '16px', color: '#666' }}>
                    minutes (default: {Math.floor(defaultTimeLimit / 60)})
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#888', marginTop: '5px' }}>
                  {customTimeLimit !== null ? `Custom time: ${customTimeLimit} minutes` : 'Using default timing'}
                </div>
              </div>
              <p>
                <strong>Questions:</strong> {targetQuestions}{' '}
                {currentData.adaptiveMode && !isWarmupMode ? '(Adaptive)' : ''}
              </p>
              <p>
                <strong>Section Type:</strong>{' '}
                {isDataInsights ? 'Data Insights' : isVerbal ? 'Verbal Reasoning' : 'Quantitative Reasoning'}
              </p>
              <p style={{ marginTop: '20px', fontSize: '16px', color: '#888' }}>
                {isWarmupMode
                  ? 'This is a warmup session. Questions are selected for practice without adaptive difficulty adjustment.'
                  : currentData.adaptiveMode
                  ? 'This is an adaptive test. Question difficulty will adjust based on your performance. You can bookmark questions for review. Once you start, the timer will begin and you cannot go back to previous questions.'
                  : 'You can bookmark questions for review. Once you start, the timer will begin and you cannot go back to previous questions.'}
              </p>
            </div>

            <button
              onClick={startTest}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '6px',
                fontSize: '18px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#229954')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#27ae60')}
      >
              Start {isWarmupMode ? 'Warmup' : 'Test'}
            </button>
            
            {!isWarmupMode && (
              <div style={{ marginTop: '15px' }}>
                <TimelineButton onClick={() => setShowTimeline(true)} />
              </div>
            )}
          </div>
        </div>
        
       {showTimeline && renderTimeline()}
      </div>
    );
  }

  // Completion screen
  if (isCompleted) {
    const score = calculateScore();

    // Prepare detailed results data
    const detailedResults = adaptiveQuestions.map((question, index) => {
      const userAnswer = selectedAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;

      return {
        sequenceNumber: index + 1,
        originalId: question.ogQuestionNumber || question.id,
        difficulty: question.difficulty,
        userAnswer: userAnswer || 'No Answer',
        correctAnswer: question.correctAnswer,
        isCorrect,
        wasBookmarked: bookmarkedQuestions.has(question.id),
        timeSpent: questionTimes[question.id] || 0,
      };
    });

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            backgroundColor: '#2c3e50',
            color: 'white',
            padding: '14px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            GMAT™ Practice Test -{' '}
            {isDataInsights ? 'Data Insights' : isVerbal ? 'Verbal Reasoning' : 'Quantitative Reasoning'}
            {isWarmupMode && <span style={{ color: '#f39c12', marginLeft: '8px' }}>(WARMUP)</span>}
          </span>
          <span style={{ fontSize: '16px' }}>Test Complete</span>
        </div>

        <div
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            padding: '10px 22px',
            fontSize: '16px',
            fontWeight: '500',
          }}
        >
          {currentData.sectionName}
        </div>

        <div
          style={{
            flex: 1,
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            backgroundColor: '#f8f9fa',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center',
              maxWidth: '1200px',
              width: '100%',
            }}
          >
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '24px' }}>
              {isWarmupMode ? 'Warmup Results' : 'Test Results'}
            </h2>

            {testStartTime && (
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px', textAlign: 'center' }}>
                Test started: {testStartTime.toLocaleDateString()} at {testStartTime.toLocaleTimeString()}
              </div>
            )}

            {/* Score Summary */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
              }}
            >
              <div>
                <div style={{ fontSize: '48px', color: '#27ae60', fontWeight: 'bold' }}>{score.gmatScore}</div>
                <div style={{ fontSize: '16px', color: '#666' }}>Score (60-90)</div>
              </div>
              <div>
                <div style={{ fontSize: '48px', color: '#3498db', fontWeight: 'bold' }}>
                  {score.accuracyPercentage}%
                </div>
                <div style={{ fontSize: '16px', color: '#666' }}>Overall Accuracy</div>
              </div>
              <div>
                <div style={{ fontSize: '48px', color: '#e67e22', fontWeight: 'bold' }}>
                  {score.totalCorrect}/{score.totalQuestions}
                </div>
                <div style={{ fontSize: '16px', color: '#666' }}>Questions Correct</div>
              </div>
            </div>

            {/* Performance Level - only show for adaptive tests */}
            {currentData.adaptiveMode && !isWarmupMode && (
              <div style={{ fontSize: '18px', color: '#666', marginBottom: '25px' }}>
                Adaptive Performance Level:{' '}
                <strong
                  style={{
                    color:
                      score.performanceLevel === 'hard'
                        ? '#27ae60'
                        : score.performanceLevel === 'medium'
                        ? '#f39c12'
                        : '#e74c3c',
                    textTransform: 'capitalize',
                  }}
                >
                  {score.performanceLevel}
                </strong>
              </div>
            )}

            {/* Difficulty Breakdown */}
            <div
              style={{
                textAlign: 'left',
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '6px',
                marginBottom: '25px',
              }}
            >
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', textAlign: 'center', fontSize: '18px' }}>
                Performance by Difficulty
              </h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
                <span style={{ color: '#27ae60', fontWeight: '500' }}>Easy:</span>
                <span>
                  {score.correctByDifficulty.easy}/{score.totalByDifficulty.easy} correct (
                  {score.totalByDifficulty.easy > 0
                    ? Math.round((score.correctByDifficulty.easy / score.totalByDifficulty.easy) * 100)
                    : 0}
                  %)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
                <span style={{ color: '#f39c12', fontWeight: '500' }}>Medium:</span>
                <span>
                  {score.correctByDifficulty.medium}/{score.totalByDifficulty.medium} correct (
                  {score.totalByDifficulty.medium > 0
                    ? Math.round((score.correctByDifficulty.medium / score.totalByDifficulty.medium) * 100)
                    : 0}
                  %)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                <span style={{ color: '#e74c3c', fontWeight: '500' }}>Hard:</span>
                <span>
                  {score.correctByDifficulty.hard}/{score.totalByDifficulty.hard} correct (
                  {score.totalByDifficulty.hard > 0
                    ? Math.round((score.correctByDifficulty.hard / score.totalByDifficulty.hard) * 100)
                    : 0}
                  %)
                </span>
              </div>
            </div>
            {/* Time Pressure Analysis */}
            {!isWarmupMode && renderTimePressureGraph()}

            {/* Detailed Results Table */}
            <div style={{ marginBottom: '25px' }}></div>

            {/* Detailed Results Table */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px' }}>Detailed Question Analysis</h4>
              <div style={{ overflow: 'auto', maxHeight: '400px', border: '1px solid #ddd', borderRadius: '6px' }}>
                <table
                  style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th
                        style={{
                          padding: '12px 10px',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: '600',
                          color: '#2c3e50',
                          textAlign: 'center',
                        }}
                      >
                        Test #
                      </th>
                      <th
                        style={{
                          padding: '12px 10px',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: '600',
                          color: '#2c3e50',
                          textAlign: 'center',
                        }}
                      >
                        Original ID
                      </th>
                      <th
                        style={{
                          padding: '12px 10px',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: '600',
                          color: '#2c3e50',
                          textAlign: 'center',
                        }}
                      >
                        Difficulty
                      </th>
                      <th
                        style={{
                          padding: '12px 10px',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: '600',
                          color: '#2c3e50',
                          textAlign: 'center',
                        }}
                      >
                        Your Answer
                      </th>
                      <th
                        style={{
                          padding: '12px 10px',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: '600',
                          color: '#2c3e50',
                          textAlign: 'center',
                        }}
                      >
                        Correct Answer
                      </th>
                      <th
                        style={{
                          padding: '12px 10px',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: '600',
                          color: '#2c3e50',
                          textAlign: 'center',
                        }}
                      >
                        Time
                      </th>
                      <th
                        style={{
                          padding: '12px 10px',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: '600',
                          color: '#2c3e50',
                          textAlign: 'center',
                        }}
                      >
                        Result
                      </th>
                      <th
                        style={{
                          padding: '12px 10px',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: '600',
                          color: '#2c3e50',
                          textAlign: 'center',
                        }}
                      >
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedResults.map((result, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: '1px solid #dee2e6',
                          backgroundColor: result.isCorrect ? '#f8fff8' : '#fff5f5',
                        }}
                      >
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>
                          {result.sequenceNumber}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>{result.originalId}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor:
                                result.difficulty === 'easy'
                                  ? '#d4edda'
                                  : result.difficulty === 'medium'
                                  ? '#fff3cd'
                                  : '#f8d7da',
                              color:
                                result.difficulty === 'easy'
                                  ? '#155724'
                                  : result.difficulty === 'medium'
                                  ? '#856404'
                                  : '#721c24',
                            }}
                          >
                            {result.difficulty.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>{result.userAnswer}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>
                          {result.correctAnswer}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>
                          <span
                            style={{
                              color: result.timeSpent > 150 ? '#e74c3c' : result.timeSpent < 60 ? '#27ae60' : '#f39c12',
                            }}
                          >
                            {formatTime(result.timeSpent)}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span
                            style={{
                              color: result.isCorrect ? '#27ae60' : '#e74c3c',
                              fontWeight: 'bold',
                              fontSize: '16px',
                            }}
                          >
                            {result.isCorrect ? '✓' : '✗'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {result.wasBookmarked && <span style={{ color: '#f39c12' }}>📑</span>}
                          {result.userAnswer === 'No Answer' && (
                            <span style={{ color: '#6c757d', fontSize: '12px' }}>Unanswered</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ fontSize: '16px', color: '#888', marginBottom: '20px' }}>
              Time used: {formatTime(timeLimit - timeRemaining)}
              {timeRemaining === 0 && <span style={{ color: '#e74c3c', marginLeft: '10px' }}>(Time Expired)</span>}
            </div>

            {/* Timeline Button */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={handleTimelineToggle}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
              >
                📅 View GMAT Timeline
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main test interface (simplified for space)
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '14px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: '500' }}>
          GMAT™ Practice Test -{' '}
          {isDataInsights ? 'Data Insights' : isVerbal ? 'Verbal Reasoning' : 'Quantitative Reasoning'}
          {isWarmupMode && <span style={{ color: '#f39c12', marginLeft: '8px' }}>(WARMUP)</span>}
        </span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '16px',
              color: isTimeWarning ? '#e74c3c' : 'white',
              fontWeight: isTimeWarning ? 'bold' : 'normal',
            }}
          >
            {formatTime(timeRemaining)}
          </span>
          <span style={{ fontSize: '16px' }}>
            {currentQuestionIndex + 1} of {adaptiveQuestions.length}
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div
        style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '10px 22px',
          fontSize: '16px',
          fontWeight: '500',
        }}
      >
        {currentData.sectionName}
      </div>

      {/* Main Content Area - Split layout for Verbal RC, single column for others */}
      {isVerbal && currentPassage ? (
        // Split layout for Reading Comprehension
        <div style={{ flex: 1, display: 'flex', gap: '30px', padding: '25px' }}>
          {/* Left side - Passage */}
          <div style={{ flex: '0 0 45%', minWidth: '400px' }}>{renderPassage(currentPassage)}</div>

          {/* Right side - Question */}
          <div style={{ flex: 1, paddingLeft: '10px' }}>
            {currentQuestion && (
              <div style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '35px', color: '#2c3e50' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '15px',
                  }}
                >
                  <span style={{ color: '#2c3e50', fontSize: '18px', marginRight: '8px' }}>
                    {currentQuestionIndex + 1}.
                  </span>
                  <button
                    onClick={() => toggleBookmark(currentQuestion.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: bookmarkedQuestions.has(currentQuestion.id) ? '2px solid #f39c12' : '2px solid #ddd',
                      color: bookmarkedQuestions.has(currentQuestion.id) ? '#f39c12' : '#666',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    📑 {bookmarkedQuestions.has(currentQuestion.id) ? 'Bookmarked' : 'Bookmark'}
                  </button>
                </div>
                <div
                  dangerouslySetInnerHTML={{ __html: formatMath(formatRomanNumerals(currentQuestion.questionText)) }}
                ></div>
              </div>
            )}

            {/* Answer Options for RC */}
            {currentQuestion && (
              <div style={{ maxWidth: '100%' }}>
                {currentQuestion.options &&
                  Object.entries(currentQuestion.options).map(([letter, text]) => (
                    <div
                      key={letter}
                      style={{
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        padding: '10px 15px',
                        borderRadius: '4px',
                        backgroundColor: selectedAnswers[currentQuestion.id] === letter ? '#fff3cd' : 'transparent',
                        border:
                          selectedAnswers[currentQuestion.id] === letter
                            ? '2px solid #ffc107'
                            : '2px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => handleAnswerSelect(currentQuestion.id, letter)}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={letter}
                        checked={selectedAnswers[currentQuestion.id] === letter}
                        onChange={() => handleAnswerSelect(currentQuestion.id, letter)}
                        style={{ marginRight: '15px', marginTop: '2px', transform: 'scale(1.3)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span
                          style={{ fontSize: '18px', lineHeight: '1.4' }}
                          dangerouslySetInnerHTML={{ __html: formatMath(text) }}
                        ></span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Single column layout for Quantitative, Data Insights, and Critical Reasoning
        <div style={{ flex: 1, padding: '35px 45px', overflow: 'auto' }}>
          {/* Question Text */}
          {currentQuestion && (
            <div style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '35px', color: '#2c3e50' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <span style={{ color: '#2c3e50', fontSize: '18px', marginRight: '8px' }}>
                  {currentQuestionIndex + 1}.
                </span>
                <button
                  onClick={() => toggleBookmark(currentQuestion.id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: bookmarkedQuestions.has(currentQuestion.id) ? '2px solid #f39c12' : '2px solid #ddd',
                    color: bookmarkedQuestions.has(currentQuestion.id) ? '#f39c12' : '#666',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  📑 {bookmarkedQuestions.has(currentQuestion.id) ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: formatMath(formatRomanNumerals(currentQuestion.questionText)) }}
              ></div>
            </div>
          )}

          {/* Visual Elements */}
          {currentQuestion && currentQuestion.visual && (
            <div style={{ marginBottom: '20px' }}>{renderQuestionVisual(currentQuestion.visual)}</div>
          )}

          {/* Answer Options */}
          {currentQuestion && (
            <div style={{ maxWidth: '650px' }}>
              {currentQuestion.options &&
                Object.entries(currentQuestion.options).map(([letter, text]) => (
                  <div
                    key={letter}
                    style={{
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      backgroundColor: selectedAnswers[currentQuestion.id] === letter ? '#fff3cd' : 'transparent',
                      border:
                        selectedAnswers[currentQuestion.id] === letter ? '2px solid #ffc107' : '2px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => handleAnswerSelect(currentQuestion.id, letter)}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={letter}
                      checked={selectedAnswers[currentQuestion.id] === letter}
                      onChange={() => handleAnswerSelect(currentQuestion.id, letter)}
                      style={{ marginRight: '15px', marginTop: '2px', transform: 'scale(1.3)' }}
                    />
                    <div>
                      <span
                        style={{ fontSize: '18px', lineHeight: '1.4' }}
                        dangerouslySetInnerHTML={{ __html: formatMath(text) }}
                      ></span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div
        style={{
          backgroundColor: '#3498db',
          padding: '14px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid white',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleNext}
            disabled={!isQuestionAnswered(currentQuestion)}
            style={{
              backgroundColor: isQuestionAnswered(currentQuestion) ? '#27ae60' : '#95a5a6',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: isQuestionAnswered(currentQuestion) ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            {currentQuestionIndex === adaptiveQuestions.length - 1 ? 'Finish Test' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Modals */}

      {isPaused && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)', // Safari support
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <style>
            {`
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }
        
        .pause-content {
          transform: scale(0.9);
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        @keyframes scaleIn {
          to { transform: scale(1); }
        }
      `}
          </style>
          <div
            className="pause-content"
            style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid #e0e0e0',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '20px',
                color: '#3498db',
              }}
            >
              ⏸️
            </div>
            <h3
              style={{
                color: '#2c3e50',
                marginBottom: '15px',
                fontSize: '24px',
                fontWeight: '600',
              }}
            >
              Test Paused
            </h3>
            <p
              style={{
                marginBottom: '25px',
                color: '#666',
                fontSize: '16px',
                lineHeight: '1.5',
              }}
            >
              Your test is paused. The timer is stopped.
              <br />
              Click Resume when you're ready to continue.
            </p>
            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '25px',
                border: '1px solid #e9ecef',
              }}
            >
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>Time Remaining</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#495057' }}>{formatTime(timeRemaining)}</div>
            </div>
            <button
              onClick={() => setIsPaused(false)}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(39, 174, 96, 0.3)',
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#229954';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#27ae60';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(39, 174, 96, 0.3)';
              }}
            >
              ▶ Resume Test
            </button>
          </div>
        </div>
      )}

      {showTimeWarning && timeRemaining > 0 && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '35px',
              borderRadius: '8px',
              textAlign: 'center',
              maxWidth: '450px',
            }}
          >
            <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '20px' }}>Time Warning</h3>
            <p style={{ marginBottom: '20px', color: '#666', fontSize: '16px' }}>
              You have {Math.ceil(timeRemaining / 60)} minutes remaining.
            </p>
            <button
              onClick={() => setShowTimeWarning(false)}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              minWidth: '450px',
              maxWidth: '520px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #dee2e6',
            }}
          >
            <div
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                padding: '14px 22px',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: '500' }}>Response Confirmation</span>
              <button
                onClick={cancelNext}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '3px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '25px' }}>
                <div
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginRight: '15px',
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                >
                  i
                </div>
                <div>
                  <div style={{ fontSize: '18px', color: '#2c3e50', fontWeight: '500', marginBottom: '15px' }}>
                    Have you completed your response?
                  </div>
                  <div style={{ fontSize: '16px', color: '#666', lineHeight: '1.4' }}>
                    Click <strong>Yes</strong> to{' '}
                    {currentQuestionIndex === adaptiveQuestions.length - 1
                      ? 'see your results'
                      : 'move to the next question'}
                    .<br />
                    Click <strong>No</strong> to continue responding to this question.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '25px' }}>
                <button
                  onClick={confirmNext}
                  style={{
                    backgroundColor: 'white',
                    color: '#333',
                    border: '1px solid #ddd',
                    padding: '10px 30px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    minWidth: '90px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={cancelNext}
                  style={{
                    backgroundColor: 'white',
                    color: '#333',
                    border: '1px solid #ddd',
                    padding: '10px 30px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    minWidth: '90px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}




    </div>
  );
};

export default GMATInterface;
