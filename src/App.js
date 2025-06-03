import React, { useState, useEffect } from 'react';

// Try to import actual data, fallback to mock data
let questionData;
try {
  questionData = require('./questionData.json');
} catch (error) {
  // Fallback mock data with dummy questions
  questionData = {
    "sectionName": "Practice Test - Development Mode",
    "testDescription": "This practice test covers basic reasoning and mathematical concepts. Questions include simple arithmetic, logic, and general knowledge to test the interface functionality.",
    "skillsAssessed": [
      "Basic arithmetic and number sense",
      "Simple logical reasoning",
      "Reading comprehension",
      "Pattern recognition"
    ],
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

  // Initialize questions when test starts (adaptive or non-adaptive)
  const initializeAdaptiveQuestions = () => {
    if (questionData.adaptiveMode) {
      // Adaptive mode: Create realistic difficulty progression with randomization
      const allQuestions = questionData.questions.filter(q => !q.buffer);
      const bufferQuestions = questionData.questions.filter(q => q.buffer);
      
      // Group questions by difficulty
      const questionsByDifficulty = {
        easy: [...allQuestions.filter(q => q.difficulty === 'easy')],
        medium: [...allQuestions.filter(q => q.difficulty === 'medium')],
        hard: [...allQuestions.filter(q => q.difficulty === 'hard')]
      };
      
      // Add buffer questions to their respective difficulty pools
      bufferQuestions.forEach(q => {
        if (questionsByDifficulty[q.difficulty]) {
          questionsByDifficulty[q.difficulty].push(q);
        }
      });
      
      // Shuffle each difficulty pool for randomization
      Object.keys(questionsByDifficulty).forEach(difficulty => {
        questionsByDifficulty[difficulty] = shuffleArray(questionsByDifficulty[difficulty]);
      });
      
      // Create realistic GMAT adaptive difficulty progression
      const difficultyPattern = createAdaptiveDifficultyPattern(targetQuestions);
      
      const questionsToUse = [];
      const usedQuestionIds = new Set();
      
      // Select questions based on difficulty pattern
      for (let i = 0; i < difficultyPattern.length; i++) {
        const targetDifficulty = difficultyPattern[i];
        let selectedQuestion = null;
        
        // Try to find unused question of target difficulty
        const pool = questionsByDifficulty[targetDifficulty];
        if (pool && pool.length > 0) {
          selectedQuestion = pool.find(q => !usedQuestionIds.has(q.id));
        }
        
        // Fallback to other difficulties if needed
        if (!selectedQuestion) {
          const fallbackOrder = targetDifficulty === 'easy' ? ['medium', 'hard'] :
                               targetDifficulty === 'medium' ? ['easy', 'hard'] :
                               ['medium', 'easy'];
          
          for (const fallbackDiff of fallbackOrder) {
            const fallbackPool = questionsByDifficulty[fallbackDiff];
            if (fallbackPool && fallbackPool.length > 0) {
              selectedQuestion = fallbackPool.find(q => !usedQuestionIds.has(q.id));
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
    } else {
      // Non-adaptive mode: Use questions in order up to targetQuestions
      const questionsToUse = questionData.questions.slice(0, targetQuestions);
      setAdaptiveQuestions(questionsToUse);
    }
  };

  // Helper function to create realistic adaptive difficulty pattern
  const createAdaptiveDifficultyPattern = (numQuestions) => {
    const pattern = [];
    
    // Start with medium difficulty
    pattern.push('medium');
    
    // Create realistic progression simulating typical GMAT adaptive behavior
    for (let i = 1; i < numQuestions; i++) {
      const position = i / numQuestions; // 0 to 1
      
      // Early questions (first 30%): Mix of easy/medium with some harder
      if (position < 0.3) {
        const rand = Math.random();
        if (rand < 0.4) pattern.push('easy');
        else if (rand < 0.8) pattern.push('medium');
        else pattern.push('hard');
      }
      // Middle questions (30-70%): More varied difficulty
      else if (position < 0.7) {
        const rand = Math.random();
        if (rand < 0.3) pattern.push('easy');
        else if (rand < 0.6) pattern.push('medium');
        else pattern.push('hard');
      }
      // Later questions (70%+): Tend toward medium/hard
      else {
        const rand = Math.random();
        if (rand < 0.2) pattern.push('easy');
        else if (rand < 0.5) pattern.push('medium');
        else pattern.push('hard');
      }
    }
    
    return pattern;
  };

  // Helper function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Update performance level based on recent answers (simplified for new adaptive system)
  const updatePerformanceLevel = () => {
    if (!questionData.adaptiveMode || currentQuestionIndex < 3) return;
    
    // Look at last 3-5 questions for performance assessment
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
    
    // Update performance level for scoring purposes
    if (recentAccuracy >= 0.8) {
      setPerformanceLevel('hard');
    } else if (recentAccuracy >= 0.6) {
      setPerformanceLevel('medium');
    } else {
      setPerformanceLevel('easy');
    }
  };

  // Format mathematical expressions
  const formatMath = (text) => {
    if (!text) return text;
    
    // Replace common mathematical notation
    return text
      // Superscripts (handle parentheses first, then simple cases)
      .replace(/\^(\([^)]+\))/g, '<sup>$1</sup>')  // ^(n+1) -> <sup>(n+1)</sup>
      .replace(/\^(\d+)/g, '<sup>$1</sup>')        // ^2 -> <sup>2</sup>
      .replace(/\^(\w+)/g, '<sup>$1</sup>')        // ^n -> <sup>n</sup>
      // Subscripts (handle parentheses first, then simple cases)
      .replace(/_(\([^)]+\))/g, '<sub>$1</sub>')   // _(n+1) -> <sub>(n+1)</sub>
      .replace(/_(\d+)/g, '<sub>$1</sub>')         // _2 -> <sub>2</sub>
      .replace(/_(\w+)/g, '<sub>$1</sub>')         // _n -> <sub>n</sub>
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
    
    // Only update performance level for adaptive tests
    if (questionData.adaptiveMode) {
      updatePerformanceLevel();
    }
    
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

  // Calculate score with different logic for adaptive vs non-adaptive
  const calculateScore = () => {
    let totalPoints = 0;
    let maxPossiblePoints = 0;
    let correctByDifficulty = { easy: 0, medium: 0, hard: 0 };
    let totalByDifficulty = { easy: 0, medium: 0, hard: 0 };
    
    if (questionData.adaptiveMode) {
      // Adaptive scoring with enhanced point values
      const pointValues = { easy: 1, medium: 2.5, hard: 4 };
      const firstSevenBonus = 1.2;
      
      adaptiveQuestions.forEach((question, index) => {
        const difficulty = question.difficulty;
        let points = pointValues[difficulty];
        
        // Apply first seven bonus for adaptive tests
        if (index < 7) {
          points *= firstSevenBonus;
        }
        
        totalByDifficulty[difficulty]++;
        maxPossiblePoints += points;
        
        if (selectedAnswers[question.id] === question.correctAnswer) {
          correctByDifficulty[difficulty]++;
          totalPoints += points;
        }
      });
      
      // Calculate raw percentage and apply adaptive scaling
      const rawPercentage = totalPoints / maxPossiblePoints;
      let scalingFactor = 1.0;
      if (performanceLevel === 'hard') scalingFactor = 1.1;
      else if (performanceLevel === 'easy') scalingFactor = 0.9;
      
      const adjustedPercentage = Math.min(rawPercentage * scalingFactor, 1.0);
      const gmatScore = Math.round(60 + (adjustedPercentage * 30));
      
      return {
        gmatScore,
        accuracyPercentage: Math.round((Object.values(correctByDifficulty).reduce((a, b) => a + b, 0) / adaptiveQuestions.length) * 100),
        totalPoints: Math.round(totalPoints),
        maxPossiblePoints: Math.round(maxPossiblePoints),
        correctByDifficulty,
        totalByDifficulty,
        totalCorrect: Object.values(correctByDifficulty).reduce((a, b) => a + b, 0),
        totalQuestions: adaptiveQuestions.length,
        performanceLevel
      };
    } else {
      // Non-adaptive scoring - simpler calculation
      const pointValues = { easy: 1, medium: 2, hard: 3 };
      
      adaptiveQuestions.forEach((question) => {
        const difficulty = question.difficulty;
        const points = pointValues[difficulty];
        
        totalByDifficulty[difficulty]++;
        maxPossiblePoints += points;
        
        if (selectedAnswers[question.id] === question.correctAnswer) {
          correctByDifficulty[difficulty]++;
          totalPoints += points;
        }
      });
      
      // Simple percentage-based GMAT score for non-adaptive
      const rawPercentage = totalPoints / maxPossiblePoints;
      const gmatScore = Math.round(60 + (rawPercentage * 30));
      
      return {
        gmatScore,
        accuracyPercentage: Math.round((Object.values(correctByDifficulty).reduce((a, b) => a + b, 0) / adaptiveQuestions.length) * 100),
        totalPoints: Math.round(totalPoints),
        maxPossiblePoints: Math.round(maxPossiblePoints),
        correctByDifficulty,
        totalByDifficulty,
        totalCorrect: Object.values(correctByDifficulty).reduce((a, b) => a + b, 0),
        totalQuestions: adaptiveQuestions.length,
        performanceLevel: 'N/A' // Not applicable for non-adaptive tests
      };
    }
  };

  const currentQuestion = adaptiveQuestions[currentQuestionIndex];
  const isTimeWarning = timeRemaining <= timeLimit / 9; // Last 1/9th of time

  // Don't render question area until adaptive questions are initialized
  if (hasStarted && adaptiveQuestions.length === 0) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '20px', color: '#3498db', marginBottom: '10px' }}>
            {questionData.adaptiveMode ? 'Initializing Adaptive Test...' : 'Loading Test Questions...'}
          </div>
          <div style={{ fontSize: '16px', color: '#666' }}>
            {questionData.adaptiveMode ? 'Setting up questions based on your profile' : 'Preparing your question set'}
          </div>
        </div>
      </div>
    );
  }

  // Safety check for currentQuestion
  if (hasStarted && (!currentQuestion || currentQuestionIndex >= adaptiveQuestions.length)) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        {/* Header */}
        <div style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '14px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            GMAT™ Practice Test - Practice Session
            {questionData.sectionName.includes('Development Mode') && 
              <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
            }
          </span>
          <span style={{ fontSize: '16px' }}>
            Ready to Begin
          </span>
        </div>

        {/* Section Header */}
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '10px 22px',
          fontSize: '16px',
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
            maxWidth: '700px'
          }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '24px' }}>
              {questionData.sectionName}
              {questionData.sectionName.includes('Development Mode') && 
                <div style={{ fontSize: '16px', color: '#e74c3c', marginTop: '5px' }}>
                  (Using fallback data - questionData.json not found)
                </div>
              }
            </h2>

            {/* Test Summary */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '25px', 
              borderRadius: '6px',
              marginBottom: '25px',
              textAlign: 'left'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px', textAlign: 'center' }}>
                What This Test Covers
              </h3>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '15px', lineHeight: '1.6' }}>
                {questionData.testDescription || "This section tests your quantitative reasoning abilities through various mathematical concepts and problem-solving scenarios."}
              </div>
              {questionData.skillsAssessed && questionData.skillsAssessed.length > 0 && (
                <div>
                  <strong style={{ color: '#2c3e50', fontSize: '16px' }}>Skills Assessed:</strong>
                  <ul style={{ 
                    marginTop: '8px', 
                    paddingLeft: '20px',
                    fontSize: '16px',
                    color: '#666',
                    lineHeight: '1.6'
                  }}>
                    {questionData.skillsAssessed.map((skill, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ fontSize: '18px', color: '#666', marginBottom: '25px', lineHeight: '1.6' }}>
              <p><strong>Time Limit:</strong> {Math.floor(timeLimit / 60)} minutes</p>
              <p><strong>Questions:</strong> {targetQuestions} {questionData.adaptiveMode ? '(Adaptive)' : ''}</p>
              <p style={{ marginTop: '20px', fontSize: '16px', color: '#888' }}>
                {questionData.adaptiveMode ? 
                  'This is an adaptive test. Question difficulty will adjust based on your performance. Once you start, the timer will begin and you cannot go back to previous questions.' :
                  'Once you start, the timer will begin and you cannot go back to previous questions.'
                }
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
          padding: '14px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            GMAT™ Practice Test - Practice Session
            {questionData.sectionName.includes('Development Mode') && 
              <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
            }
          </span>
          <span style={{ fontSize: '16px' }}>
            Test Complete
          </span>
        </div>

        {/* Section Header */}
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '10px 22px',
          fontSize: '16px',
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
          justifyContent: 'flex-start',
          backgroundColor: '#f8f9fa',
          overflow: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '800px',
            width: '100%'
          }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '24px' }}>Test Results</h2>
            
            {/* Test Summary */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '25px',
              textAlign: 'left'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px', textAlign: 'center' }}>
                Test Coverage Summary
              </h3>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '15px', lineHeight: '1.6' }}>
                {questionData.testDescription || "This section tested your quantitative reasoning abilities through various mathematical concepts and problem-solving scenarios."}
              </div>
              {questionData.skillsAssessed && questionData.skillsAssessed.length > 0 && (
                <div>
                  <strong style={{ color: '#2c3e50', fontSize: '16px' }}>Skills Assessed:</strong>
                  <ul style={{ 
                    marginTop: '8px', 
                    paddingLeft: '20px',
                    fontSize: '16px',
                    color: '#666',
                    lineHeight: '1.6'
                  }}>
                    {questionData.skillsAssessed.map((skill, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* GMAT Score */}
            <div style={{ fontSize: '52px', color: '#27ae60', fontWeight: 'bold', marginBottom: '10px' }}>
              {score.gmatScore}
            </div>
            <div style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>
              GMAT Quantitative Score (60-90 scale)
            </div>
            <div style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
              Accuracy: {score.accuracyPercentage}% ({score.totalCorrect}/{score.totalQuestions} correct)
            </div>
            
            {/* Performance Level - only show for adaptive tests */}
            {questionData.adaptiveMode && (
              <div style={{ fontSize: '18px', color: '#666', marginBottom: '25px' }}>
                Adaptive Performance Level: <strong style={{ 
                  color: score.performanceLevel === 'hard' ? '#27ae60' : 
                        score.performanceLevel === 'medium' ? '#f39c12' : '#e74c3c',
                  textTransform: 'capitalize'
                }}>{score.performanceLevel}</strong>
              </div>
            )}
            
            {/* Difficulty Breakdown */}
            <div style={{ 
              textAlign: 'left', 
              backgroundColor: '#f8f9fa', 
              padding: '25px', 
              borderRadius: '6px',
              marginBottom: '25px'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center', fontSize: '18px' }}>Performance by Difficulty</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '16px' }}>
                <span style={{ color: '#27ae60', fontWeight: '500' }}>Easy:</span>
                <span>{score.correctByDifficulty.easy}/{score.totalByDifficulty.easy} correct ({score.totalByDifficulty.easy > 0 ? Math.round((score.correctByDifficulty.easy / score.totalByDifficulty.easy) * 100) : 0}%)</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '16px' }}>
                <span style={{ color: '#f39c12', fontWeight: '500' }}>Medium:</span>
                <span>{score.correctByDifficulty.medium}/{score.totalByDifficulty.medium} correct ({score.totalByDifficulty.medium > 0 ? Math.round((score.correctByDifficulty.medium / score.totalByDifficulty.medium) * 100) : 0}%)</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                <span style={{ color: '#e74c3c', fontWeight: '500' }}>Hard:</span>
                <span>{score.correctByDifficulty.hard}/{score.totalByDifficulty.hard} correct ({score.totalByDifficulty.hard > 0 ? Math.round((score.correctByDifficulty.hard / score.totalByDifficulty.hard) * 100) : 0}%)</span>
              </div>
            </div>

            {/* Question-by-Question Analysis */}
            <div style={{ 
              textAlign: 'left', 
              backgroundColor: '#f8f9fa', 
              padding: '25px', 
              borderRadius: '6px',
              marginBottom: '25px'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center', fontSize: '18px' }}>Question Analysis</h4>
              
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '16px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#e9ecef' }}>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      width: '45%'
                    }}>
                      Question
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      width: '18%'
                    }}>
                      Your Answer
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      width: '18%'
                    }}>
                      Correct Answer
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      width: '19%'
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
                    
                    // Get first few words of question (up to 50 characters)
                    const questionPreview = question.questionText.length > 50 
                      ? question.questionText.substring(0, 50) + '...'
                      : question.questionText;
                    
                    // Check if this is from Official Guide
                    const hasOGNumber = question.ogQuestionNumber !== undefined;
                    
                    return (
                      <tr key={question.id} style={{ 
                        borderBottom: '1px solid #dee2e6',
                        backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                      }}>
                        <td style={{ 
                          padding: '12px 16px',
                          fontWeight: '500'
                        }}>
                          <div style={{ marginBottom: '4px' }}>
                            Q{question.id}
                            {hasOGNumber && (
                              <span style={{ 
                                color: '#666', 
                                fontSize: '13px', 
                                fontWeight: '400',
                                marginLeft: '6px'
                              }}>
                                (OG #{question.ogQuestionNumber})
                              </span>
                            )}
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: question.difficulty === 'easy' ? '#27ae60' : 
                                     question.difficulty === 'medium' ? '#f39c12' : '#e74c3c',
                              textTransform: 'uppercase',
                              fontWeight: '600'
                            }}>
                              {question.difficulty}
                            </span>
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            color: '#666', 
                            fontWeight: '400',
                            lineHeight: '1.3'
                          }}>
                            {questionPreview}
                          </div>
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          textAlign: 'center',
                          fontWeight: '600',
                          color: isUnattempted ? '#6c757d' : (isCorrect ? '#27ae60' : '#e74c3c')
                        }}>
                          {chosenAnswer}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#27ae60'
                        }}>
                          {correctAnswer}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
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
            
            <div style={{ fontSize: '16px', color: '#888' }}>
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
        padding: '14px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '16px', fontWeight: '500' }}>
          GMAT™ Practice Test - Practice Session
          {questionData.sectionName.includes('Development Mode') && 
            <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
          }
        </span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '16px', 
            color: isTimeWarning ? '#e74c3c' : 'white',
            fontWeight: isTimeWarning ? 'bold' : 'normal'
          }}>
            {formatTime(timeRemaining)}
          </span>
          <span style={{ fontSize: '16px' }}>
            {currentQuestionIndex + 1} of {adaptiveQuestions.length}
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div style={{
        backgroundColor: '#3498db',
        color: 'white',
        padding: '10px 22px',
        fontSize: '16px',
        fontWeight: '500'
      }}>
        {questionData.sectionName}
      </div>

      {/* Question Area */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        padding: '35px 45px',
        overflow: 'auto',
        filter: isPaused ? 'blur(5px)' : 'none',
        transition: 'filter 0.3s ease'
      }}>
        {/* Question Text */}
        <div style={{
          fontSize: '18px',
          lineHeight: '1.6',
          marginBottom: '35px',
          color: '#2c3e50'
        }}>
          <span style={{ color: '#2c3e50', fontSize: '18px', marginRight: '8px' }}>
            {currentQuestionIndex + 1}.
          </span>
          <span className="math-text" dangerouslySetInnerHTML={{ __html: formatMath(currentQuestion.questionText) }}></span>
        </div>

        {/* Answer Options */}
        <div style={{ maxWidth: '650px' }}>
          {Object.entries(currentQuestion.options).map(([letter, text]) => (
            <div key={letter} style={{
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'flex-start',
              cursor: 'pointer',
              padding: '10px 15px',
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
                  marginRight: '15px',
                  marginTop: '2px',
                  transform: 'scale(1.3)'
                }}
              />
              <div>
                <span className="math-text" style={{ fontSize: '18px', lineHeight: '1.4' }} dangerouslySetInnerHTML={{ __html: formatMath(text) }}>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        backgroundColor: '#3498db',
        padding: '14px 22px',
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
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
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
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: selectedAnswers[currentQuestion.id] ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {currentQuestionIndex === adaptiveQuestions.length - 1 ? 'Finish Test' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Paused Overlay */}
      {isPaused && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '20px' }}>Test Paused</h3>
            <p style={{ marginBottom: '25px', color: '#666', fontSize: '16px' }}>
              Click Resume to continue your test.
            </p>
            <button
              onClick={() => setIsPaused(false)}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              ▶ Resume Test
            </button>
          </div>
        </div>
      )}

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
            padding: '35px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '450px'
          }}>
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
                fontSize: '16px'
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
            borderRadius: '8px',
            minWidth: '450px',
            maxWidth: '520px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #dee2e6'
          }}>
            {/* Header */}
            <div style={{
              backgroundColor: '#3498db',
              color: 'white',
              padding: '14px 22px',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
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
                  borderRadius: '3px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '25px' }}>
                <div style={{
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
                  flexShrink: 0
                }}>
                  i
                </div>
                <div>
                  <div style={{ fontSize: '18px', color: '#2c3e50', fontWeight: '500', marginBottom: '15px' }}>
                    Have you completed your response?
                  </div>
                  <div style={{ fontSize: '16px', color: '#666', lineHeight: '1.4' }}>
                    Click <strong>Yes</strong> to move to the {currentQuestionIndex === adaptiveQuestions.length - 1 ? 'results' : 'next question'}.<br />
                    Click <strong>No</strong> to continue responding to this question.
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                justifyContent: 'center',
                marginTop: '25px'
              }}>
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
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.borderColor = '#999';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#ddd';
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
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.borderColor = '#999';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#ddd';
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