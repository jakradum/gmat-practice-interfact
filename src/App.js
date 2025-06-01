import React, { useState, useEffect } from 'react';

// Try to import actual data, fallback to mock data
let questionData;
try {
  questionData = require('./questionData.json');
} catch (error) {
  // Fallback mock data with dummy questions
  questionData = {
    "sectionName": "Practice Test - Development Mode",
    "adaptiveMode": true,
    "targetQuestions": 3,
    "bufferQuestions": 1,
    "firstSevenStrategy": "controlled challenge",
    "questions": [
      {
        "id": 1,
        "questionText": "What is your favorite color?",
        "difficulty": "easy",
        "options": {
          "A": "Red",
          "B": "Blue", 
          "C": "Green",
          "D": "Yellow",
          "E": "Purple"
        },
        "correctAnswer": "B",
        "buffer": false
      },
      {
        "id": 2,
        "questionText": "Which animal says 'meow'?",
        "difficulty": "medium",
        "options": {
          "A": "Dog",
          "B": "Cat", 
          "C": "Bird",
          "D": "Fish",
          "E": "Horse"
        },
        "correctAnswer": "B",
        "buffer": false
      },
      {
        "id": 3,
        "questionText": "If a^2 + b^2 = dummy, what is dummy? (Test math formatting)",
        "difficulty": "hard",
        "options": {
          "A": "x^2",
          "B": "y^3", 
          "C": "z^4",
          "D": "Test formatting",
          "E": "sqrt(25)"
        },
        "correctAnswer": "D",
        "buffer": false
      },
      {
        "id": 4,
        "questionText": "What comes after Monday?",
        "difficulty": "easy",
        "options": {
          "A": "Sunday",
          "B": "Tuesday", 
          "C": "Wednesday",
          "D": "Thursday",
          "E": "Friday"
        },
        "correctAnswer": "B",
        "buffer": true
      }
    ]
  };
  console.log('Using fallback mock data - questionData.json not found');
}

const GMATInterface = () => {
  // Calculate GMAT timing dynamically from JSON: 45 minutes for targetQuestions (2.14 mins per question)
  const targetQuestions = questionData.targetQuestions || 21;
  const timeLimit = Math.round((45 * 60 * targetQuestions) / 21); // Scale 45 mins proportionally
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [performanceLevel, setPerformanceLevel] = useState('medium'); // 'easy', 'medium', 'hard'
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Timer effect
  useEffect(() => {
    if (hasStarted && !isPaused && !isCompleted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
    
    // Auto-complete test when timer reaches 0
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

  // Initialize adaptive questions when test starts
  const initializeAdaptiveQuestions = () => {
    // Get non-buffer and buffer questions from JSON
    const coreQuestions = questionData.questions.filter(q => !q.buffer);
    const bufferQuestions = questionData.questions.filter(q => q.buffer);
    
    // Take exactly targetQuestions number of questions
    const questionsToUse = [];
    
    // Start with first 7 core questions (First Seven Fortress strategy)
    questionsToUse.push(...coreQuestions.slice(0, 7));
    
    // Add remaining questions up to targetQuestions
    const remainingSlots = targetQuestions - 7;
    const remainingCore = coreQuestions.slice(7);
    
    // Fill remaining slots with core questions first, then buffer if needed
    if (remainingCore.length >= remainingSlots) {
      questionsToUse.push(...remainingCore.slice(0, remainingSlots));
    } else {
      questionsToUse.push(...remainingCore);
      const stillNeed = remainingSlots - remainingCore.length;
      questionsToUse.push(...bufferQuestions.slice(0, stillNeed));
    }
    
    setAdaptiveQuestions(questionsToUse);
  };

  // Update performance level based on recent answers
  const updatePerformanceLevel = () => {
    if (currentQuestionIndex >= 7) {
      const recentAnswers = adaptiveQuestions.slice(Math.max(0, currentQuestionIndex - 5), currentQuestionIndex);
      let correctCount = 0;
      
      recentAnswers.forEach(question => {
        if (selectedAnswers[question.id] === question.correctAnswer) {
          correctCount++;
        }
      });
      
      const recentAccuracy = correctCount / recentAnswers.length;
      
      if (recentAccuracy >= 0.8) {
        setPerformanceLevel('hard');
      } else if (recentAccuracy >= 0.6) {
        setPerformanceLevel('medium');
      } else {
        setPerformanceLevel('easy');
      }
    }
  };

  // Format mathematical expressions
  const formatMath = (text) => {
    if (!text) return text;
    
    // Replace common mathematical notation
    return text
      // Superscripts
      .replace(/\^(\d+)/g, '<sup>$1</sup>')
      .replace(/\^(\w+)/g, '<sup>$1</sup>')
      // Subscripts  
      .replace(/_(\d+)/g, '<sub>$1</sub>')
      .replace(/_(\w+)/g, '<sub>$1</sub>')
      // Square root
      .replace(/sqrt\(([^)]+)\)/g, '√($1)')
      // Fractions (simple pattern)
      .replace(/(\d+)\/(\d+)/g, '<sup>$1</sup>⁄<sub>$2</sub>')
      // Degree symbol
      .replace(/degrees?/g, '°')
      // Mathematical symbols
      .replace(/\*\*/g, '×')
      .replace(/\+\-/g, '±')
      .replace(/!=/g, '≠')
      .replace(/<=/g, '≤')
      .replace(/>=/g, '≥');
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the test
  const startTest = () => {
    setHasStarted(true);
    initializeAdaptiveQuestions();
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Navigate to next question
  const handleNext = () => {
    // Show confirmation modal instead of immediately proceeding
    setShowConfirmModal(true);
  };

  // Handle confirmation to proceed to next question
  const confirmNext = () => {
    setShowConfirmModal(false);
    updatePerformanceLevel();
    
    if (currentQuestionIndex < adaptiveQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Handle cancellation (stay on current question)
  const cancelNext = () => {
    setShowConfirmModal(false);
  };

  // Calculate score with GMAT adaptive scoring (60-90 scale)
  const calculateScore = () => {
    let totalPoints = 0;
    let maxPossiblePoints = 0;
    let correctByDifficulty = { easy: 0, medium: 0, hard: 0 };
    let totalByDifficulty = { easy: 0, medium: 0, hard: 0 };
    
    // Enhanced point values for adaptive scoring
    const pointValues = { easy: 1, medium: 2.5, hard: 4 };
    
    // First seven questions get bonus weighting (adaptive algorithm impact)
    const firstSevenBonus = 1.2;
    
    adaptiveQuestions.forEach((question, index) => {
      const difficulty = question.difficulty;
      let points = pointValues[difficulty];
      
      // Apply first seven bonus
      if (index < 7) {
        points *= firstSevenBonus;
      }
      
      // Count totals by difficulty
      totalByDifficulty[difficulty]++;
      maxPossiblePoints += points;
      
      // Check if answer is correct
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctByDifficulty[difficulty]++;
        totalPoints += points;
      }
    });
    
    // Calculate raw percentage
    const rawPercentage = totalPoints / maxPossiblePoints;
    
    // Convert to GMAT scale (60-90)
    // Use adaptive performance level to adjust scaling
    let scalingFactor = 1.0;
    if (performanceLevel === 'hard') scalingFactor = 1.1;
    else if (performanceLevel === 'easy') scalingFactor = 0.9;
    
    const adjustedPercentage = Math.min(rawPercentage * scalingFactor, 1.0);
    
    // GMAT scoring: 60-90 scale
    const gmatScore = Math.round(60 + (adjustedPercentage * 30));
    const accuracyPercentage = Math.round((Object.values(correctByDifficulty).reduce((a, b) => a + b, 0) / adaptiveQuestions.length) * 100);
    
    return {
      gmatScore,
      accuracyPercentage,
      totalPoints: Math.round(totalPoints),
      maxPossiblePoints: Math.round(maxPossiblePoints),
      correctByDifficulty,
      totalByDifficulty,
      totalCorrect: Object.values(correctByDifficulty).reduce((a, b) => a + b, 0),
      totalQuestions: adaptiveQuestions.length,
      performanceLevel
    };
  };

  const currentQuestion = adaptiveQuestions[currentQuestionIndex];
  const isTimeWarning = timeRemaining <= timeLimit / 9; // Last 1/9th of time

  // Don't render question area until adaptive questions are initialized
  if (hasStarted && adaptiveQuestions.length === 0) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', color: '#3498db', marginBottom: '10px' }}>Initializing Adaptive Test...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Setting up questions based on your profile</div>
        </div>
      </div>
    );
  }

  // Safety check for currentQuestion
  if (hasStarted && (!currentQuestion || currentQuestionIndex >= adaptiveQuestions.length)) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', color: '#e74c3c', marginBottom: '10px' }}>Test Error</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Unable to load question. Please restart the test.</div>
        </div>
      </div>
    );
  }

  // Start screen
  if (!hasStarted) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            GMAT™ Practice Test - Practice Session
            {questionData.sectionName.includes('Development Mode') && 
              <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
            }
          </span>
          <span style={{ fontSize: '14px' }}>
            Ready to Begin
          </span>
        </div>

        {/* Section Header */}
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '8px 20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {questionData.sectionName}
        </div>

        {/* Start Screen */}
        <div style={{
          flex: 1,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '600px'
          }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
              {questionData.sectionName}
              {questionData.sectionName.includes('Development Mode') && 
                <div style={{ fontSize: '14px', color: '#e74c3c', marginTop: '5px' }}>
                  (Using fallback data - questionData.json not found)
                </div>
              }
            </h2>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '25px', lineHeight: '1.6' }}>
              <p>You are about to begin the {questionData.sectionName} section.</p>
              <p><strong>Time Limit:</strong> {Math.floor(timeLimit / 60)} minutes</p>
              <p><strong>Questions:</strong> {targetQuestions} (Adaptive)</p>
              <p style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
                This is an adaptive test. Question difficulty will adjust based on your performance.
                Once you start, the timer will begin and you cannot go back to previous questions.
              </p>
            </div>
            <button
              onClick={startTest}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#229954'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Completion screen
  if (isCompleted) {
    const score = calculateScore();
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            GMAT™ Practice Test - Practice Session
            {questionData.sectionName.includes('Development Mode') && 
              <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
            }
          </span>
          <span style={{ fontSize: '14px' }}>
            Test Complete
          </span>
        </div>

        {/* Section Header */}
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '8px 20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {questionData.sectionName}
        </div>

        {/* Results */}
        <div style={{
          flex: 1,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '600px'
          }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Test Results</h2>
            
            {/* GMAT Score */}
            <div style={{ fontSize: '48px', color: '#27ae60', fontWeight: 'bold', marginBottom: '10px' }}>
              {score.gmatScore}
            </div>
            <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
              GMAT Quantitative Score (60-90 scale)
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
              Accuracy: {score.accuracyPercentage}% ({score.totalCorrect}/{score.totalQuestions} correct)
            </div>
            
            {/* Performance Level */}
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>
              Adaptive Performance Level: <strong style={{ 
                color: score.performanceLevel === 'hard' ? '#27ae60' : 
                      score.performanceLevel === 'medium' ? '#f39c12' : '#e74c3c',
                textTransform: 'capitalize'
              }}>{score.performanceLevel}</strong>
            </div>
            
            {/* Difficulty Breakdown */}
            <div style={{ 
              textAlign: 'left', 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', textAlign: 'center' }}>Performance by Difficulty</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#27ae60', fontWeight: '500' }}>Easy:</span>
                <span>{score.correctByDifficulty.easy}/{score.totalByDifficulty.easy} correct ({score.totalByDifficulty.easy > 0 ? Math.round((score.correctByDifficulty.easy / score.totalByDifficulty.easy) * 100) : 0}%)</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#f39c12', fontWeight: '500' }}>Medium:</span>
                <span>{score.correctByDifficulty.medium}/{score.totalByDifficulty.medium} correct ({score.totalByDifficulty.medium > 0 ? Math.round((score.correctByDifficulty.medium / score.totalByDifficulty.medium) * 100) : 0}%)</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e74c3c', fontWeight: '500' }}>Hard:</span>
                <span>{score.correctByDifficulty.hard}/{score.totalByDifficulty.hard} correct ({score.totalByDifficulty.hard > 0 ? Math.round((score.correctByDifficulty.hard / score.totalByDifficulty.hard) * 100) : 0}%)</span>
              </div>
            </div>

            {/* Question-by-Question Analysis */}
            <div style={{ 
              textAlign: 'left', 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '20px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', textAlign: 'center' }}>Question Analysis</h4>
              
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#e9ecef' }}>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600'
                    }}>
                      Question
                    </th>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'center', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600'
                    }}>
                      Your Answer
                    </th>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'center', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600'
                    }}>
                      Correct Answer
                    </th>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'center', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600'
                    }}>
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adaptiveQuestions.map((question, index) => {
                    const chosenAnswer = selectedAnswers[question.id] || '--';
                    const correctAnswer = question.correctAnswer;
                    const isCorrect = chosenAnswer === correctAnswer;
                    const isUnattempted = chosenAnswer === '--';
                    
                    return (
                      <tr key={question.id} style={{ 
                        borderBottom: '1px solid #dee2e6',
                        backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                      }}>
                        <td style={{ 
                          padding: '8px 12px',
                          fontWeight: '500'
                        }}>
                          Q{index + 1}
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '11px',
                            color: question.difficulty === 'easy' ? '#27ae60' : 
                                   question.difficulty === 'medium' ? '#f39c12' : '#e74c3c',
                            textTransform: 'uppercase',
                            fontWeight: '600'
                          }}>
                            {question.difficulty}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'center',
                          fontWeight: '600',
                          color: isUnattempted ? '#6c757d' : (isCorrect ? '#27ae60' : '#e74c3c')
                        }}>
                          {chosenAnswer}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#27ae60'
                        }}>
                          {correctAnswer}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'center',
                          fontWeight: '600'
                        }}>
                          {isUnattempted ? (
                            <span style={{ color: '#6c757d' }}>--</span>
                          ) : isCorrect ? (
                            <span style={{ color: '#27ae60' }}>✓</span>
                          ) : (
                            <span style={{ color: '#e74c3c' }}>✗</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div style={{ fontSize: '14px', color: '#888' }}>
              Time used: {formatTime(timeLimit - timeRemaining)}
              {timeRemaining === 0 && <span style={{ color: '#e74c3c', marginLeft: '10px' }}>(Time Expired)</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      {/* Add mathematical formatting styles */}
      <style>{`
        sup {
          font-size: 0.8em;
          vertical-align: super;
          line-height: 0;
        }
        sub {
          font-size: 0.8em;
          vertical-align: sub;
          line-height: 0;
        }
        .math-text {
          font-family: 'Times New Roman', serif;
        }
      `}</style>
      {/* Header */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>
          GMAT™ Practice Test - Practice Session
          {questionData.sectionName.includes('Development Mode') && 
            <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
          }
        </span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '14px', 
            color: isTimeWarning ? '#e74c3c' : 'white',
            fontWeight: isTimeWarning ? 'bold' : 'normal'
          }}>
            {formatTime(timeRemaining)}
          </span>
          <span style={{ fontSize: '14px' }}>
            {currentQuestionIndex + 1} of {adaptiveQuestions.length}
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div style={{
        backgroundColor: '#3498db',
        color: 'white',
        padding: '8px 20px',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {questionData.sectionName}
      </div>

      {/* Question Area */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        padding: '30px 40px',
        overflow: 'auto'
      }}>
        {/* Question Text */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '30px',
          color: '#2c3e50'
        }}>
          <span style={{ color: '#2c3e50', fontSize: '16px', marginRight: '8px' }}>
            {currentQuestionIndex + 1}.
          </span>
          <span className="math-text" dangerouslySetInnerHTML={{ __html: formatMath(currentQuestion.questionText) }}></span>
        </div>

        {/* Answer Options */}
        <div style={{ maxWidth: '600px' }}>
          {Object.entries(currentQuestion.options).map(([letter, text]) => (
            <div key={letter} style={{
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: selectedAnswers[currentQuestion.id] === letter ? '#fff3cd' : 'transparent',
              border: selectedAnswers[currentQuestion.id] === letter ? '2px solid #ffc107' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleAnswerSelect(currentQuestion.id, letter)}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={letter}
                checked={selectedAnswers[currentQuestion.id] === letter}
                onChange={() => handleAnswerSelect(currentQuestion.id, letter)}
                style={{
                  marginRight: '12px',
                  marginTop: '2px',
                  transform: 'scale(1.2)'
                }}
              />
              <div>
                <span className="math-text" style={{ fontSize: '16px', lineHeight: '1.4' }} dangerouslySetInnerHTML={{ __html: formatMath(text) }}>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        backgroundColor: '#3498db',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid white',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            style={{
              backgroundColor: 'transparent',
              border: '1px solid white',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📄 Help
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestion.id]}
            style={{
              backgroundColor: selectedAnswers[currentQuestion.id] ? '#27ae60' : '#95a5a6',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: selectedAnswers[currentQuestion.id] ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {currentQuestionIndex === adaptiveQuestions.length - 1 ? 'Finish Test' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Time Warning Modal */}
      {showTimeWarning && timeRemaining > 0 && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>Time Warning</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              You have {Math.ceil(timeRemaining / 60)} minutes remaining.
            </p>
            <button
              onClick={() => setShowTimeWarning(false)}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
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
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '450px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px' }}>
              Ready to Proceed?
            </h3>
            <p style={{ marginBottom: '25px', color: '#666', lineHeight: '1.5' }}>
              Are you ready to move to the {currentQuestionIndex === adaptiveQuestions.length - 1 ? 'results' : 'next question'}?
              <br />
              <span style={{ fontSize: '14px', color: '#888' }}>
                {currentQuestionIndex === adaptiveQuestions.length - 1 ? 
                  'This will complete your test.' : 
                  'You cannot return to this question once you proceed.'
                }
              </span>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={cancelNext}
                style={{
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
              >
                Cancel
              </button>
              <button
                onClick={confirmNext}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#229954'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
              >
                {currentQuestionIndex === adaptiveQuestions.length - 1 ? 'Finish Test' : 'Yes, Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GMATInterface;