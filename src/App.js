import React, { useState, useEffect } from 'react';

// Try to import actual data, fallback to mock data
let questionData;
try {
  questionData = require('./questionData.json');
} catch (error) {
  // Fallback mock data with dummy questions for both quant and DI
  questionData = {
    "sectionName": "Practice Test - Development Mode",
    "sectionType": "dataInsights", // or "quantitative"
    "testDescription": "This practice test covers data interpretation and analysis. Questions include graphics interpretation, table analysis, and multi-source reasoning.",
    "skillsAssessed": [
      "Graphics interpretation and trend analysis",
      "Table analysis and data comparison", 
      "Multi-source reasoning and synthesis",
      "Data sufficiency evaluation"
    ],
    "adaptiveMode": true,
    "targetQuestions": 4,
    "bufferQuestions": 1,
    "timeLimit": 1920, // 32 minutes in seconds - NEW FIELD
    "firstSevenStrategy": "controlled challenge",
    "dataSources": [
      {
        "id": "graph1",
        "type": "graph",
        "title": "Company Revenue by Quarter (2020-2024)",
        "data": {
          "type": "line",
          "xAxis": "Quarter",
          "yAxis": "Revenue ($ millions)",
          "series": [
            {"name": "Product A", "color": "#3498db", "points": [{"x": "Q1 2020", "y": 15}, {"x": "Q2 2020", "y": 18}, {"x": "Q3 2020", "y": 22}, {"x": "Q4 2020", "y": 25}, {"x": "Q1 2021", "y": 28}, {"x": "Q2 2021", "y": 32}]},
            {"name": "Product B", "color": "#e74c3c", "points": [{"x": "Q1 2020", "y": 12}, {"x": "Q2 2020", "y": 14}, {"x": "Q3 2020", "y": 16}, {"x": "Q4 2020", "y": 19}, {"x": "Q1 2021", "y": 23}, {"x": "Q2 2021", "y": 26}]}
          ]
        }
      },
      {
        "id": "table1", 
        "type": "table",
        "title": "Employee Performance Metrics by Department",
        "data": {
          "headers": ["Department", "Employees", "Avg Salary ($)", "Satisfaction (%)", "Turnover (%)"],
          "rows": [
            ["Engineering", "45", "95000", "87", "8"],
            ["Marketing", "23", "75000", "82", "12"], 
            ["Sales", "34", "68000", "79", "15"],
            ["HR", "12", "72000", "91", "5"],
            ["Finance", "18", "88000", "85", "7"]
          ]
        }
      },
      {
        "id": "multiSource1",
        "type": "multiSource", 
        "title": "Market Research Analysis",
        "sources": [
          {
            "tabName": "Survey Results",
            "type": "text",
            "content": "A recent consumer survey of 1,200 participants revealed that 68% prefer Brand X over competitors. The survey was conducted across three age groups: 18-35 (42% of respondents), 36-50 (38% of respondents), and 51+ (20% of respondents). Brand preference varied significantly by age group, with younger consumers showing 78% preference for Brand X, middle-aged consumers showing 65% preference, and older consumers showing 52% preference."
          },
          {
            "tabName": "Sales Data", 
            "type": "table",
            "data": {
              "headers": ["Region", "Q1 Sales", "Q2 Sales", "Growth %"],
              "rows": [
                ["North", "$2.1M", "$2.4M", "14.3"],
                ["South", "$1.8M", "$2.0M", "11.1"],
                ["East", "$2.5M", "$2.9M", "16.0"],
                ["West", "$1.9M", "$2.2M", "15.8"]
              ]
            }
          }
        ]
      }
    ],
    "questions": [
      {
        "id": 1,
        "dataSourceId": "graph1",
        "questionText": "Based on the revenue data shown, what was the approximate total revenue for Product A in 2020?",
        "difficulty": "easy",
        "options": {
          "A": "$65 million",
          "B": "$70 million", 
          "C": "$80 million",
          "D": "$85 million",
          "E": "$90 million"
        },
        "correctAnswer": "C",
        "buffer": false
      },
      {
        "id": 2,
        "dataSourceId": "table1",
        "questionText": "Which department has the highest ratio of average salary to turnover percentage?",
        "difficulty": "medium",
        "options": {
          "A": "Engineering",
          "B": "Marketing", 
          "C": "Sales",
          "D": "HR",
          "E": "Finance"
        },
        "correctAnswer": "A",
        "buffer": false
      },
      {
        "id": 3,
        "dataSourceId": "multiSource1",
        "questionText": "Based on the survey results, approximately how many respondents aged 18-35 preferred Brand X?",
        "difficulty": "medium",
        "options": {
          "A": "390",
          "B": "420", 
          "C": "450",
          "D": "480",
          "E": "510"
        },
        "correctAnswer": "A",
        "buffer": false
      },
      {
        "id": 4,
        "dataSourceId": "multiSource1", 
        "questionText": "Which region showed the highest sales growth percentage from Q1 to Q2?",
        "difficulty": "hard",
        "options": {
          "A": "North",
          "B": "South",
          "C": "East", 
          "D": "West",
          "E": "Cannot be determined"
        },
        "correctAnswer": "C",
        "buffer": true
      }
    ]
  };
  console.log('Using fallback mock data - questionData.json not found');
}

const GMATInterface = () => {
  // Check if this is a Data Insights section
  const isDataInsights = questionData.sectionType === 'dataInsights';
  
  // Calculate GMAT timing correctly
  const targetQuestions = questionData.targetQuestions || 21;
  const timeLimit = questionData.timeLimit || (() => {
    // Fallback calculation based on section type if timeLimit not specified
    if (isDataInsights) {
      return Math.round((45 * 60 * targetQuestions) / 20); // DI: 45 min for 20 questions
    } else {
      return Math.round((45 * 60 * targetQuestions) / 21); // Quant: 45 min for 21 questions
    }
  })();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [performanceLevel, setPerformanceLevel] = useState('medium');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Bookmark functionality
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());
  const [isReviewingBookmarks, setIsReviewingBookmarks] = useState(false);
  const [bookmarkReviewIndex, setBookmarkReviewIndex] = useState(0);
  
  // Edit functionality
  const [editsUsed, setEditsUsed] = useState(0);
  const [maxEdits] = useState(Math.floor(targetQuestions / 7) || 1); // 1/7th ratio
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [isEditingPrevious, setIsEditingPrevious] = useState(false);
  const [editQuestionIndex, setEditQuestionIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Data Insights specific state
  const [activeTab, setActiveTab] = useState(0); // For multi-source reasoning
  const [currentDataSource, setCurrentDataSource] = useState(null);

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

  // Update current data source when question changes (for DI)
  useEffect(() => {
    if (isDataInsights && adaptiveQuestions.length > 0) {
      const actualIndex = isReviewingBookmarks ? bookmarkReviewIndex : currentQuestionIndex;
      const currentQuestion = isReviewingBookmarks ? 
        Array.from(bookmarkedQuestions).map(id => adaptiveQuestions.find(q => q.id === id))[actualIndex] :
        adaptiveQuestions[actualIndex];
        
      if (currentQuestion) {
        const dataSource = questionData.dataSources?.find(ds => ds.id === currentQuestion.dataSourceId);
        setCurrentDataSource(dataSource);
        setActiveTab(0); // Reset to first tab for multi-source
      }
    }
  }, [currentQuestionIndex, bookmarkReviewIndex, adaptiveQuestions, isDataInsights, isReviewingBookmarks, bookmarkedQuestions]);

  // Initialize questions
  const initializeAdaptiveQuestions = () => {
    if (questionData.adaptiveMode) {
      const allQuestions = questionData.questions.filter(q => !q.buffer);
      const bufferQuestions = questionData.questions.filter(q => q.buffer);
      
      const questionsByDifficulty = {
        easy: [...allQuestions.filter(q => q.difficulty === 'easy')],
        medium: [...allQuestions.filter(q => q.difficulty === 'medium')],
        hard: [...allQuestions.filter(q => q.difficulty === 'hard')]
      };
      
      bufferQuestions.forEach(q => {
        if (questionsByDifficulty[q.difficulty]) {
          questionsByDifficulty[q.difficulty].push(q);
        }
      });
      
      Object.keys(questionsByDifficulty).forEach(difficulty => {
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
          selectedQuestion = pool.find(q => !usedQuestionIds.has(q.id));
        }
        
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
      const questionsToUse = questionData.questions.slice(0, targetQuestions);
      setAdaptiveQuestions(questionsToUse);
    }
  };

  // Helper functions
  const createAdaptiveDifficultyPattern = (numQuestions) => {
    const pattern = [];
    pattern.push('medium');
    
    for (let i = 1; i < numQuestions; i++) {
      const position = i / numQuestions;
      
      if (position < 0.3) {
        const rand = Math.random();
        if (rand < 0.4) pattern.push('easy');
        else if (rand < 0.8) pattern.push('medium');
        else pattern.push('hard');
      }
      else if (position < 0.7) {
        const rand = Math.random();
        if (rand < 0.3) pattern.push('easy');
        else if (rand < 0.6) pattern.push('medium');
        else pattern.push('hard');
      }
      else {
        const rand = Math.random();
        if (rand < 0.2) pattern.push('easy');
        else if (rand < 0.5) pattern.push('medium');
        else pattern.push('hard');
      }
    }
    
    return pattern;
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const updatePerformanceLevel = () => {
    if (!questionData.adaptiveMode || currentQuestionIndex < 3) return;
    
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
  };

  // Bookmark functions
  const toggleBookmark = (questionId) => {
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const startBookmarkReview = () => {
    if (bookmarkedQuestions.size > 0) {
      setIsReviewingBookmarks(true);
      setBookmarkReviewIndex(0);
    }
  };

  const exitBookmarkReview = () => {
    setIsReviewingBookmarks(false);
    setBookmarkReviewIndex(0);
  };

  // Edit functions
  const startEditQuestion = (questionIndex) => {
    if (editsUsed >= maxEdits) return;
    setIsEditingPrevious(true);
    setEditQuestionIndex(questionIndex);
    setEditsUsed(prev => prev + 1);
  };

  const exitEditMode = () => {
    setIsEditingPrevious(false);
    setEditQuestionIndex(0);
  };

  // Format mathematical expressions with proper type checking
  const formatMath = (text) => {
    if (!text) return '';
    
    const textStr = typeof text === 'string' ? text : String(text);
    
    return textStr
      .replace(/\^(\([^)]+\))/g, '<sup>$1</sup>')
      .replace(/\^(\d+)/g, '<sup>$1</sup>')
      .replace(/\^(\w+)/g, '<sup>$1</sup>')
      .replace(/_(\([^)]+\))/g, '<sub>$1</sub>')
      .replace(/_(\d+)/g, '<sub>$1</sub>')
      .replace(/_(\w+)/g, '<sub>$1</sub>')
      .replace(/sqrt\(([^)]+)\)/g, '√($1)')
      .replace(/(\d+)\/(\d+)/g, '<sup>$1</sup>⁄<sub>$2</sub>')
      .replace(/degrees?/g, '°')
      .replace(/\*\*/g, '×')
      .replace(/\+\-/g, '±')
      .replace(/!=/g, '≠')
      .replace(/<=/g, '≤')
      .replace(/>=/g, '≥');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = () => {
    setHasStarted(true);
    initializeAdaptiveQuestions();
  };

  // Check if current question is answered based on its format
  const isQuestionAnswered = (question) => {
    if (question.questionFormat === 'tableAnalysis') {
      return question.statements?.every((_, index) => 
        selectedAnswers[`${question.id}-${index}`] !== undefined
      ) || false;
    } else if (question.questionFormat === 'twoPartAnalysis') {
      return question.columns?.every((_, colIndex) => 
        selectedAnswers[`${question.id}-col${colIndex}`] !== undefined
      ) || false;
    } else {
      return selectedAnswers[question.id] !== undefined;
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Track that this question has been answered
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
  };

  const handleNext = () => {
    setShowConfirmModal(true);
  };

  const confirmNext = () => {
    setShowConfirmModal(false);
    
    if (questionData.adaptiveMode) {
      updatePerformanceLevel();
    }
    
    if (isReviewingBookmarks) {
      // Handle bookmark navigation
      const bookmarkArray = Array.from(bookmarkedQuestions);
      if (bookmarkReviewIndex < bookmarkArray.length - 1) {
        setBookmarkReviewIndex(prev => prev + 1);
      } else {
        // Finished reviewing bookmarks
        setIsCompleted(true);
      }
    } else {
      // Normal navigation
      if (currentQuestionIndex < adaptiveQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Check if there are bookmarked questions to review
        if (bookmarkedQuestions.size > 0 && timeRemaining > 0) {
          startBookmarkReview();
        } else {
          setIsCompleted(true);
        }
      }
    }
  };

  const cancelNext = () => {
    setShowConfirmModal(false);
  };

  // Calculate score with support for different question formats
  const calculateScore = () => {
    let totalPoints = 0;
    let maxPossiblePoints = 0;
    let correctByDifficulty = { easy: 0, medium: 0, hard: 0 };
    let totalByDifficulty = { easy: 0, medium: 0, hard: 0 };
    
    const isQuestionCorrect = (question) => {
      if (question.questionFormat === 'tableAnalysis') {
        return question.statements?.every((statement, index) => 
          selectedAnswers[`${question.id}-${index}`] === statement.answer
        ) || false;
      } else if (question.questionFormat === 'twoPartAnalysis') {
        if (!question.correctAnswer) return false;
        return question.columns?.every((_, colIndex) => {
          const correctKey = colIndex === 0 ? Object.keys(question.correctAnswer)[0] : Object.keys(question.correctAnswer)[1];
          const correctValue = question.correctAnswer[correctKey];
          return selectedAnswers[`${question.id}-col${colIndex}`] === correctValue;
        }) || false;
      } else {
        return selectedAnswers[question.id] === question.correctAnswer;
      }
    };
    
    if (questionData.adaptiveMode) {
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
        performanceLevel: 'N/A'
      };
    }
  };

  // Render question visual content (for Quantitative questions)
  const renderQuestionVisual = (visual) => {
    if (!visual) return null;

    switch (visual.type) {
      case 'table':
        return (
          <div style={{
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            {visual.title && (
              <h4 style={{ 
                marginBottom: '15px', 
                fontSize: '16px', 
                color: '#2c3e50',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                {visual.title}
              </h4>
            )}
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                backgroundColor: 'white',
                margin: '0 auto'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    {visual.data.headers.map((header, idx) => (
                      <th key={idx} style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        borderBottom: '2px solid #dee2e6',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        <span dangerouslySetInnerHTML={{ __html: formatMath(header) }}></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visual.data.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} style={{
                      borderBottom: '1px solid #dee2e6'
                    }}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} style={{
                          padding: '8px 12px',
                          textAlign: 'center',
                          color: '#333'
                        }}>
                          <span dangerouslySetInnerHTML={{ __html: formatMath(cell) }}></span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'diagram':
        return (
          <div style={{
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #ddd',
            textAlign: 'center'
          }}>
            {visual.title && (
              <h4 style={{ 
                marginBottom: '15px', 
                fontSize: '16px', 
                color: '#2c3e50',
                fontWeight: '600'
              }}>
                {visual.title}
              </h4>
            )}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '6px',
              display: 'inline-block',
              border: '1px solid #ddd'
            }}>
              <svg 
                width={visual.dimensions?.width || 400} 
                height={visual.dimensions?.height || 300} 
                viewBox={`0 0 ${visual.dimensions?.width || 400} ${visual.dimensions?.height || 300}`}
              >
                {visual.elements?.map((element, idx) => {
                  switch (element.type) {
                    case 'line':
                      return (
                        <line
                          key={idx}
                          x1={element.x1}
                          y1={element.y1}
                          x2={element.x2}
                          y2={element.y2}
                          stroke={element.color || '#333'}
                          strokeWidth={element.width || 2}
                        />
                      );
                    case 'circle':
                      return (
                        <circle
                          key={idx}
                          cx={element.x}
                          cy={element.y}
                          r={element.radius}
                          fill={element.fill || 'none'}
                          stroke={element.color || '#333'}
                          strokeWidth={element.width || 2}
                        />
                      );
                    case 'rectangle':
                      return (
                        <rect
                          key={idx}
                          x={element.x}
                          y={element.y}
                          width={element.width}
                          height={element.height}
                          fill={element.fill || 'none'}
                          stroke={element.color || '#333'}
                          strokeWidth={element.strokeWidth || 2}
                        />
                      );
                    case 'text':
                      return (
                        <text
                          key={idx}
                          x={element.x}
                          y={element.y}
                          fontSize={element.size || 14}
                          fill={element.color || '#333'}
                          textAnchor={element.anchor || 'middle'}
                          fontWeight={element.weight || 'normal'}
                        >
                          {element.content}
                        </text>
                      );
                    case 'path':
                      return (
                        <path
                          key={idx}
                          d={element.d}
                          fill={element.fill || 'none'}
                          stroke={element.color || '#333'}
                          strokeWidth={element.width || 2}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </svg>
            </div>
            {visual.caption && (
              <div style={{ 
                marginTop: '10px', 
                fontSize: '14px', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                {visual.caption}
              </div>
            )}
          </div>
        );

      case 'equation':
        return (
          <div style={{
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #ddd',
            textAlign: 'center'
          }}>
            {visual.title && (
              <h4 style={{ 
                marginBottom: '15px', 
                fontSize: '16px', 
                color: '#2c3e50',
                fontWeight: '600'
              }}>
                {visual.title}
              </h4>
            )}
            <div style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '18px',
              fontFamily: '"Times New Roman", serif'
            }}>
              <span dangerouslySetInnerHTML={{ __html: formatMath(visual.content) }}></span>
            </div>
            {visual.description && (
              <div style={{ 
                marginTop: '10px', 
                fontSize: '14px', 
                color: '#666'
              }}>
                {visual.description}
              </div>
            )}
          </div>
        );

      case 'coordinate':
        return (
          <div style={{
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #ddd',
            textAlign: 'center'
          }}>
            {visual.title && (
              <h4 style={{ 
                marginBottom: '15px', 
                fontSize: '16px', 
                color: '#2c3e50',
                fontWeight: '600'
              }}>
                {visual.title}
              </h4>
            )}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '6px',
              display: 'inline-block',
              border: '1px solid #ddd'
            }}>
              <svg width="400" height="300" viewBox="0 0 400 300">
                {/* Grid */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Axes */}
                <line x1="0" y1="150" x2="400" y2="150" stroke="#333" strokeWidth="2" />
                <line x1="200" y1="0" x2="200" y2="300" stroke="#333" strokeWidth="2" />
                
                {/* Axis labels */}
                <text x="390" y="145" fontSize="12" fill="#333">x</text>
                <text x="205" y="15" fontSize="12" fill="#333">y</text>
                
                {/* Origin */}
                <text x="205" y="165" fontSize="12" fill="#333">0</text>
                
                {/* Scale markers */}
                {[-4, -3, -2, -1, 1, 2, 3, 4].map(val => (
                  <g key={`x-${val}`}>
                    <line x1={200 + val * 40} y1="145" x2={200 + val * 40} y2="155" stroke="#333" strokeWidth="1" />
                    <text x={200 + val * 40} y="170" fontSize="10" fill="#333" textAnchor="middle">{val}</text>
                  </g>
                ))}
                {[-3, -2, -1, 1, 2, 3].map(val => (
                  <g key={`y-${val}`}>
                    <line x1="195" y1={150 - val * 40} x2="205" y2={150 - val * 40} stroke="#333" strokeWidth="1" />
                    <text x="190" y={150 - val * 40 + 4} fontSize="10" fill="#333" textAnchor="end">{val}</text>
                  </g>
                ))}
                
                {/* Plot elements */}
                {visual.elements?.map((element, idx) => {
                  const x = 200 + element.x * 40;
                  const y = 150 - element.y * 40;
                  
                  switch (element.type) {
                    case 'point':
                      return (
                        <g key={idx}>
                          <circle cx={x} cy={y} r="4" fill={element.color || '#e74c3c'} />
                          {element.label && (
                            <text x={x + 8} y={y - 8} fontSize="12" fill="#333">
                              {element.label}
                            </text>
                          )}
                        </g>
                      );
                    case 'line':
                      const x1 = 200 + element.x1 * 40;
                      const y1 = 150 - element.y1 * 40;
                      const x2 = 200 + element.x2 * 40;
                      const y2 = 150 - element.y2 * 40;
                      return (
                        <line
                          key={idx}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={element.color || '#3498db'}
                          strokeWidth={element.width || 2}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </svg>
            </div>
          </div>
        );

      default:
        return (
          <div style={{
            marginBottom: '25px',
            padding: '15px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            border: '1px solid #ffc107',
            color: '#856404'
          }}>
            Unsupported visual type: {visual.type}
          </div>
        );
    }
  };

  // Render data source content for Data Insights
  const renderDataSource = (dataSource) => {
    if (!dataSource) return null;

    switch (dataSource.type) {
      case 'graph':
        return (
          <div style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#2c3e50' }}>
              {dataSource.title}
            </h3>
            <div style={{
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '30px',
              backgroundColor: '#f9f9f9',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                <strong>Y-Axis:</strong> {dataSource.data.yAxis} | <strong>X-Axis:</strong> {dataSource.data.xAxis}
              </div>
              
              <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
                {dataSource.data.series.map((series, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: series.color,
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ fontSize: '14px' }}>{series.name}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ flex: 1, position: 'relative', backgroundColor: 'white', border: '1px solid #ddd' }}>
                <svg width="100%" height="200" viewBox="0 0 400 200">
                  <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {dataSource.data.series.map((series, seriesIdx) => {
                    const allYValues = dataSource.data.series.flatMap(s => s.points.map(p => p.y));
                    const minY = Math.min(...allYValues);
                    const maxY = Math.max(...allYValues);
                    const yRange = maxY - minY;
                    
                    const points = series.points.map((point, idx) => {
                      const xPos = 40 + (idx * (320 / (series.points.length - 1)));
                      const yNormalized = (point.y - minY) / yRange;
                      const yPos = 160 - (yNormalized * 120);
                      
                      return { x: xPos, y: yPos };
                    });
                    
                    const pathData = points.map((point, idx) => 
                      `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                    ).join(' ');
                    
                    return (
                      <g key={seriesIdx}>
                        <path
                          d={pathData}
                          fill="none"
                          stroke={series.color}
                          strokeWidth="2"
                        />
                        {points.map((point, idx) => (
                          <circle
                            key={idx}
                            cx={point.x}
                            cy={point.y}
                            r="3"
                            fill={series.color}
                          />
                        ))}
                      </g>
                    );
                  })}
                  
                  <text x="20" y="15" fontSize="10" fill="#666">High</text>
                  <text x="20" y="190" fontSize="10" fill="#666">Low</text>
                  <text x="50" y="195" fontSize="10" fill="#666">Start</text>
                  <text x="350" y="195" fontSize="10" fill="#666">End</text>
                </svg>
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#2c3e50' }}>
              {dataSource.title}
            </h3>
            <div style={{ overflow: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                backgroundColor: 'white'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    {dataSource.data.headers.map((header, idx) => (
                      <th key={idx} style={{
                        padding: '12px 10px',
                        textAlign: 'left',
                        borderBottom: '2px solid #dee2e6',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataSource.data.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} style={{
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: rowIdx % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} style={{
                          padding: '10px',
                          color: '#333'
                        }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'text':
        return (
          <div style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#2c3e50' }}>
              {dataSource.title}
            </h3>
            <div style={{
              padding: '25px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              lineHeight: '1.6',
              fontSize: '15px',
              color: '#333',
              border: '1px solid #ddd'
            }}>
              {dataSource.content}
            </div>
          </div>
        );

      case 'multiSource':
        const activeSource = dataSource.sources[activeTab];
        return (
          <div style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#2c3e50' }}>
              {dataSource.title}
            </h3>
            
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
              {dataSource.sources.map((source, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    backgroundColor: activeTab === idx ? '#3498db' : 'transparent',
                    color: activeTab === idx ? 'white' : '#666',
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    marginRight: '5px',
                    fontSize: '14px',
                    fontWeight: activeTab === idx ? '600' : '400'
                  }}
                >
                  {source.tabName}
                </button>
              ))}
            </div>
            
            <div style={{ minHeight: '300px' }}>
              {activeSource.type === 'text' ? (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  lineHeight: '1.6',
                  fontSize: '15px',
                  color: '#333'
                }}>
                  {activeSource.content}
                </div>
              ) : activeSource.type === 'table' ? (
                <div style={{ overflow: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        {activeSource.data.headers.map((header, idx) => (
                          <th key={idx} style={{
                            padding: '12px 10px',
                            textAlign: 'left',
                            borderBottom: '2px solid #dee2e6',
                            fontWeight: '600',
                            color: '#2c3e50'
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeSource.data.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} style={{
                          borderBottom: '1px solid #dee2e6',
                          backgroundColor: rowIdx % 2 === 0 ? 'white' : '#f8f9fa'
                        }}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} style={{
                              padding: '10px',
                              color: '#333'
                            }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
        );

      default:
        return <div>Unsupported data source type</div>;
    }
  };

  // Get current question based on state
  const getCurrentQuestion = () => {
    if (isEditingPrevious) {
      return adaptiveQuestions[editQuestionIndex];
    }
    if (isReviewingBookmarks) {
      const bookmarkArray = Array.from(bookmarkedQuestions).map(id => 
        adaptiveQuestions.find(q => q.id === id)
      );
      return bookmarkArray[bookmarkReviewIndex];
    }
    return adaptiveQuestions[currentQuestionIndex];
  };

  const currentQuestion = getCurrentQuestion();
  const isTimeWarning = timeRemaining <= timeLimit / 9;

  // Loading states and error handling
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

  if (hasStarted && (!currentQuestion || (!isReviewingBookmarks && currentQuestionIndex >= adaptiveQuestions.length))) {
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
        <div style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '14px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            GMAT™ Practice Test - {isDataInsights ? 'Data Insights' : 'Quantitative Reasoning'}
            {questionData.sectionName.includes('Development Mode') && 
              <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
            }
          </span>
          <span style={{ fontSize: '16px' }}>Ready to Begin</span>
        </div>

        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '10px 22px',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {questionData.sectionName}
        </div>

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
                {questionData.testDescription || `This section tests your ${isDataInsights ? 'data analysis and interpretation' : 'quantitative reasoning'} abilities.`}
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
              <p><strong>Section Type:</strong> {isDataInsights ? 'Data Insights' : 'Quantitative Reasoning'}</p>
              <p style={{ marginTop: '20px', fontSize: '16px', color: '#888' }}>
                {questionData.adaptiveMode ? 
                  'This is an adaptive test. Question difficulty will adjust based on your performance. You can bookmark questions for review. Once you start, the timer will begin and you cannot go back to previous questions.' :
                  'You can bookmark questions for review. Once you start, the timer will begin and you cannot go back to previous questions.'
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
// Replace the completion screen section (around line 800-900) with this updated version:

// Completion screen
if (isCompleted) {
  const score = calculateScore();
  
  // Prepare detailed results data
  const detailedResults = adaptiveQuestions.map((question, index) => {
    const userAnswer = selectedAnswers[question.id];
    const isCorrect = (() => {
      if (question.questionFormat === 'tableAnalysis') {
        return question.statements?.every((statement, stmtIndex) => 
          selectedAnswers[`${question.id}-${stmtIndex}`] === statement.answer
        ) || false;
      } else if (question.questionFormat === 'twoPartAnalysis') {
        if (!question.correctAnswer) return false;
        return question.columns?.every((_, colIndex) => {
          const correctKey = colIndex === 0 ? Object.keys(question.correctAnswer)[0] : Object.keys(question.correctAnswer)[1];
          const correctValue = question.correctAnswer[correctKey];
          return selectedAnswers[`${question.id}-col${colIndex}`] === correctValue;
        }) || false;
      } else {
        return userAnswer === question.correctAnswer;
      }
    })();

    return {
      sequenceNumber: index + 1,
      originalId: question.ogQuestionNumber || question.id, // Use OG number if available, fallback to question ID
      difficulty: question.difficulty,
      userAnswer: userAnswer || 'No Answer',
      correctAnswer: question.correctAnswer,
      isCorrect,
      wasBookmarked: bookmarkedQuestions.has(question.id)
    };
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '14px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '16px', fontWeight: '500' }}>
          GMAT™ Practice Test - {isDataInsights ? 'Data Insights' : 'Quantitative Reasoning'}
          {questionData.sectionName.includes('Development Mode') && 
            <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
          }
        </span>
        <span style={{ fontSize: '16px' }}>Test Complete</span>
      </div>

      <div style={{
        backgroundColor: '#3498db',
        color: 'white',
        padding: '10px 22px',
        fontSize: '16px',
        fontWeight: '500'
      }}>
        {questionData.sectionName}
      </div>

      <div style={{
        flex: 1,
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#f8f9fa',
        overflow: 'auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '1200px',
          width: '100%'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '24px' }}>Test Results</h2>
          
          {bookmarkedQuestions.size > 0 && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '15px', 
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '16px'
            }}>
              📑 You bookmarked {bookmarkedQuestions.size} question{bookmarkedQuestions.size !== 1 ? 's' : ''} during this test
            </div>
          )}
          
          {/* GMAT Score Summary */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px'
          }}>
            <div>
              <div style={{ fontSize: '48px', color: '#27ae60', fontWeight: 'bold' }}>
                {score.gmatScore}
              </div>
              <div style={{ fontSize: '16px', color: '#666' }}>
                GMAT Score (60-90)
              </div>
            </div>
            <div>
              <div style={{ fontSize: '48px', color: '#3498db', fontWeight: 'bold' }}>
                {score.accuracyPercentage}%
              </div>
              <div style={{ fontSize: '16px', color: '#666' }}>
                Overall Accuracy
              </div>
            </div>
            <div>
              <div style={{ fontSize: '48px', color: '#e67e22', fontWeight: 'bold' }}>
                {score.totalCorrect}/{score.totalQuestions}
              </div>
              <div style={{ fontSize: '16px', color: '#666' }}>
                Questions Correct
              </div>
            </div>
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
            padding: '20px', 
            borderRadius: '6px',
            marginBottom: '25px'
          }}>
            <h4 style={{ color: '#2c3e50', marginBottom: '15px', textAlign: 'center', fontSize: '18px' }}>Performance by Difficulty</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
              <span style={{ color: '#27ae60', fontWeight: '500' }}>Easy:</span>
              <span>{score.correctByDifficulty.easy}/{score.totalByDifficulty.easy} correct ({score.totalByDifficulty.easy > 0 ? Math.round((score.correctByDifficulty.easy / score.totalByDifficulty.easy) * 100) : 0}%)</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
              <span style={{ color: '#f39c12', fontWeight: '500' }}>Medium:</span>
              <span>{score.correctByDifficulty.medium}/{score.totalByDifficulty.medium} correct ({score.totalByDifficulty.medium > 0 ? Math.round((score.correctByDifficulty.medium / score.totalByDifficulty.medium) * 100) : 0}%)</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
              <span style={{ color: '#e74c3c', fontWeight: '500' }}>Hard:</span>
              <span>{score.correctByDifficulty.hard}/{score.totalByDifficulty.hard} correct ({score.totalByDifficulty.hard > 0 ? Math.round((score.correctByDifficulty.hard / score.totalByDifficulty.hard) * 100) : 0}%)</span>
            </div>
          </div>

          {/* Detailed Results Table */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px' }}>Detailed Question Analysis</h4>
            <div style={{ overflow: 'auto', maxHeight: '400px', border: '1px solid #ddd', borderRadius: '6px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                backgroundColor: 'white'
              }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px 10px', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#2c3e50', textAlign: 'center' }}>
                      Test #
                    </th>
                    <th style={{ padding: '12px 10px', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#2c3e50', textAlign: 'center' }}>
                      Original ID
                    </th>
                    <th style={{ padding: '12px 10px', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#2c3e50', textAlign: 'center' }}>
                      Difficulty
                    </th>
                    <th style={{ padding: '12px 10px', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#2c3e50', textAlign: 'center' }}>
                      Your Answer
                    </th>
                    <th style={{ padding: '12px 10px', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#2c3e50', textAlign: 'center' }}>
                      Correct Answer
                    </th>
                    <th style={{ padding: '12px 10px', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#2c3e50', textAlign: 'center' }}>
                      Result
                    </th>
                    <th style={{ padding: '12px 10px', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#2c3e50', textAlign: 'center' }}>
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailedResults.map((result, index) => (
                    <tr key={index} style={{
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: result.isCorrect ? '#f8fff8' : '#fff5f5'
                    }}>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>
                        {result.sequenceNumber}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>
                        {result.originalId}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: result.difficulty === 'easy' ? '#d4edda' : 
                                         result.difficulty === 'medium' ? '#fff3cd' : '#f8d7da',
                          color: result.difficulty === 'easy' ? '#155724' : 
                                result.difficulty === 'medium' ? '#856404' : '#721c24'
                        }}>
                          {result.difficulty.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>
                        {result.userAnswer}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>
                        {result.correctAnswer}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          color: result.isCorrect ? '#27ae60' : '#e74c3c',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          {result.isCorrect ? '✓' : '✗'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {result.wasBookmarked && <span style={{ color: '#f39c12' }}>📑</span>}
                        {result.userAnswer === 'No Answer' && <span style={{ color: '#6c757d', fontSize: '12px' }}>Unanswered</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

  // Main test interface
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
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
          GMAT™ Practice Test - {isDataInsights ? 'Data Insights' : 'Quantitative Reasoning'}
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
            {isEditingPrevious ? 
              `Editing Q${editQuestionIndex + 1} (${editsUsed}/${maxEdits} edits used)` :
              isReviewingBookmarks ? 
                `Bookmark ${bookmarkReviewIndex + 1} of ${bookmarkedQuestions.size}` :
                `${currentQuestionIndex + 1} of ${adaptiveQuestions.length}`
            }
          </span>
          {bookmarkedQuestions.size > 0 && !isEditingPrevious && (
            <span style={{ fontSize: '14px', color: '#f39c12' }}>
              📑 {bookmarkedQuestions.size}
            </span>
          )}
          {editsUsed > 0 && !isEditingPrevious && (
            <span style={{ fontSize: '14px', color: '#e67e22' }}>
              ✏️ {editsUsed}/{maxEdits}
            </span>
          )}
        </div>
      </div>

      {/* Section Header */}
      <div style={{
        backgroundColor: isEditingPrevious ? '#e67e22' : isReviewingBookmarks ? '#e67e22' : '#3498db',
        color: 'white',
        padding: '10px 22px',
        fontSize: '16px',
        fontWeight: '500'
      }}>
        {isEditingPrevious ? 
          `✏️ Editing Previous Answer - ${questionData.sectionName}` :
          isReviewingBookmarks ? 
            `📑 Reviewing Bookmarked Questions - ${questionData.sectionName}` :
            questionData.sectionName
        }
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        backgroundColor: 'white',
        filter: isPaused ? 'blur(5px)' : 'none',
        transition: 'filter 0.3s ease'
      }}>
        
        {isDataInsights ? (
          // Data Insights Layout: Data on left, Question on right
          <>
            {/* Data Panel */}
            <div style={{
              width: '50%',
              borderRight: '2px solid #ddd',
              overflow: 'auto',
              backgroundColor: '#f9f9f9'
            }}>
              {currentDataSource && renderDataSource(currentDataSource)}
            </div>
            
            {/* Question Panel */}
            <div style={{
              width: '50%',
              padding: '35px 30px',
              overflow: 'auto'
            }}>
              {/* Question Visual (for Quantitative questions) */}
            {!isDataInsights && currentQuestion.visual && (
              renderQuestionVisual(currentQuestion.visual)
            )}

                          {/* Question Visual (for questions with visual elements) */}
              {currentQuestion.visual && (
                renderQuestionVisual(currentQuestion.visual)
              )}

              {/* Question Text */}
              <div style={{
                fontSize: '18px',
                lineHeight: '1.6',
                marginBottom: '35px',
                color: '#2c3e50'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ color: '#2c3e50', fontSize: '18px', marginRight: '8px' }}>
                    {isReviewingBookmarks ? 
                      `Q${currentQuestion.id} (Bookmarked)` :
                      `${currentQuestionIndex + 1}.`
                    }
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
                      fontWeight: '500'
                    }}
                  >
                    📑 {bookmarkedQuestions.has(currentQuestion.id) ? 'Bookmarked' : 'Bookmark'}
                  </button>
                </div>
                <span className="math-text" dangerouslySetInnerHTML={{ __html: formatMath(currentQuestion.questionText) }}></span>
              </div>

              {/* Answer Options */}
              <div>
                {currentQuestion.options && Object.entries(currentQuestion.options).map(([letter, text]) => (
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
          </>
        ) : (
          // Quantitative Layout: Full width question area
          <div style={{
            flex: 1,
            padding: '35px 45px',
            overflow: 'auto'
          }}>
            {/* Question Text */}
            <div style={{
              fontSize: '18px',
              lineHeight: '1.6',
              marginBottom: '35px',
              color: '#2c3e50'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ color: '#2c3e50', fontSize: '18px', marginRight: '8px' }}>
                  {isReviewingBookmarks ? 
                    `Q${currentQuestion.id} (Bookmarked)` :
                    `${currentQuestionIndex + 1}.`
                  }
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
                    fontWeight: '500'
                  }}
                >
                  📑 {bookmarkedQuestions.has(currentQuestion.id) ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>
              <span className="math-text" dangerouslySetInnerHTML={{ __html: formatMath(currentQuestion.questionText) }}></span>
            </div>

            {/* Answer Options */}
            <div style={{ maxWidth: '650px' }}>
              {currentQuestion.options && Object.entries(currentQuestion.options).map(([letter, text]) => (
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
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        backgroundColor: isReviewingBookmarks ? '#e67e22' : '#3498db',
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
          
          {!isEditingPrevious && !isReviewingBookmarks && editsUsed < maxEdits && currentQuestionIndex > 0 && (
            <button
              onClick={() => setShowEditModal(true)}
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
              ✏️ Edit Previous ({maxEdits - editsUsed} left)
            </button>
          )}
          
          {(isReviewingBookmarks || isEditingPrevious) && (
            <button
              onClick={isReviewingBookmarks ? exitBookmarkReview : exitEditMode}
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
              Exit {isReviewingBookmarks ? 'Review' : 'Edit'}
            </button>
          )}
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
              fontWeight: '500'
            }}
          >
            {isReviewingBookmarks ? 
              (bookmarkReviewIndex === Array.from(bookmarkedQuestions).length - 1 ? 'Finish Test' : 'Next Bookmark →') :
              (currentQuestionIndex === adaptiveQuestions.length - 1 ? 
                (bookmarkedQuestions.size > 0 ? 'Review Bookmarks' : 'Finish Test') : 
                'Next →')
            }
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
            <div style={{
              backgroundColor: isReviewingBookmarks ? '#e67e22' : '#3498db',
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
            
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '25px' }}>
                <div style={{
                  backgroundColor: isReviewingBookmarks ? '#e67e22' : '#3498db',
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
                    Click <strong>Yes</strong> to {
                      isReviewingBookmarks ? 
                        (bookmarkReviewIndex === Array.from(bookmarkedQuestions).length - 1 ? 'finish the test' : 'move to the next bookmarked question') :
                        (currentQuestionIndex === adaptiveQuestions.length - 1 ? 
                          (bookmarkedQuestions.size > 0 ? 'review your bookmarked questions' : 'see your results') : 
                          'move to the next question')
                    }.<br />
                    Click <strong>No</strong> to continue responding to this question.
                  </div>
                </div>
              </div>
              
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
      {/* Edit Question Selection Modal */}
      {showEditModal && (
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
            minWidth: '450px',
            maxWidth: '600px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #dee2e6'
          }}>
            <div style={{
              backgroundColor: '#e67e22',
              color: 'white',
              padding: '14px 22px',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '18px', fontWeight: '500' }}>✏️ Edit Previous Answer</span>
              <button
                onClick={() => setShowEditModal(false)}
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
              <div style={{ marginBottom: '15px', color: '#666' }}>
                Select a question to edit ({maxEdits - editsUsed} edits remaining):
              </div>
              
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {adaptiveQuestions.slice(0, currentQuestionIndex).map((question, index) => (
                  <div key={question.id} style={{
                    padding: '10px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    cursor: answeredQuestions.has(question.id) ? 'pointer' : 'not-allowed',
                    backgroundColor: answeredQuestions.has(question.id) ? '#f8f9fa' : '#e9ecef',
                    opacity: answeredQuestions.has(question.id) ? 1 : 0.6
                  }}
                  onClick={() => {
                    if (answeredQuestions.has(question.id)) {
                      startEditQuestion(index);
                      setShowEditModal(false);
                    }
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500' }}>Q{index + 1}</span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {answeredQuestions.has(question.id) && (
                          <span style={{ color: '#27ae60', fontSize: '14px' }}>✓ Answered</span>
                        )}
                        {bookmarkedQuestions.has(question.id) && (
                          <span style={{ color: '#f39c12', fontSize: '14px' }}>📑</span>
                        )}
                        {answeredQuestions.has(question.id) && (
                          <span style={{ color: '#e67e22', fontSize: '14px' }}>✏️</span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                      {question.questionText.substring(0, 60)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GMATInterface;