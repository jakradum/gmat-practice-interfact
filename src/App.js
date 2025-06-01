import React, { useState, useEffect } from 'react';
import questionData from './questionData.json';

const GMATInterface = () => {
  // Calculate time limit: 2 minutes per question (120 seconds each)
  const timeLimit = questionData.questions.length * 120;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

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

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the test
  const startTest = () => {
    setHasStarted(true);
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
    if (currentQuestionIndex < questionData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Calculate score with weighted difficulty
  const calculateScore = () => {
    let totalPoints = 0;
    let maxPossiblePoints = 0;
    let correctByDifficulty = { easy: 0, medium: 0, hard: 0 };
    let totalByDifficulty = { easy: 0, medium: 0, hard: 0 };
    
    // Point values for each difficulty level
    const pointValues = { easy: 1, medium: 2, hard: 3 };
    
    questionData.questions.forEach(question => {
      const difficulty = question.difficulty;
      const points = pointValues[difficulty];
      
      // Count totals by difficulty
      totalByDifficulty[difficulty]++;
      maxPossiblePoints += points;
      
      // Check if answer is correct
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctByDifficulty[difficulty]++;
        totalPoints += points;
      }
    });
    
    const percentage = Math.round((totalPoints / maxPossiblePoints) * 100);
    
    return {
      totalPoints,
      maxPossiblePoints,
      percentage,
      correctByDifficulty,
      totalByDifficulty,
      totalCorrect: Object.values(correctByDifficulty).reduce((a, b) => a + b, 0),
      totalQuestions: questionData.questions.length
    };
  };

  const currentQuestion = questionData.questions[currentQuestionIndex];
  const isTimeWarning = timeRemaining <= timeLimit / 9; // Last 1/9th of time

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
            </h2>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '25px', lineHeight: '1.6' }}>
              <p>You are about to begin the {questionData.sectionName} section.</p>
              <p><strong>Time Limit:</strong> {Math.floor(timeLimit / 60)} minutes</p>
              <p><strong>Questions:</strong> {questionData.questions.length}</p>
              <p style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
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
            
            {/* Overall Score */}
            <div style={{ fontSize: '48px', color: '#27ae60', fontWeight: 'bold', marginBottom: '10px' }}>
              {score.percentage}%
            </div>
            <div style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
              {score.totalPoints} out of {score.maxPossiblePoints} points
            </div>
            
            {/* Questions Breakdown */}
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>
              {score.totalCorrect} out of {score.totalQuestions} questions correct
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
            {currentQuestionIndex + 1} of {questionData.questions.length}
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
          <span dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}></span>
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
                <span style={{ fontSize: '16px', lineHeight: '1.4' }} dangerouslySetInnerHTML={{ __html: text }}>
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
            {currentQuestionIndex === questionData.questions.length - 1 ? 'Finish Test' : 'Next →'}
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
    </div>
  );
};

export default GMATInterface;