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
  
  // Calculate GMAT timing dynamically from JSON
  const targetQuestions = questionData.targetQuestions || 21;
  const timeLimit = Math.round((45 * 60 * targetQuestions) / 21);
  
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
  
  // Data Insights specific state
  const [activeTab, setActiveTab] = useState(0); // For multi-source reasoning
  const [currentDataSource, setCurrentDataSource] = useState(null);

  // Timer effect (same as before)
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
    if (isDataInsights && adaptiveQuestions.length > 0 && currentQuestionIndex < adaptiveQuestions.length) {
      const currentQuestion = adaptiveQuestions[currentQuestionIndex];
      const dataSource = questionData.dataSources?.find(ds => ds.id === currentQuestion.dataSourceId);
      setCurrentDataSource(dataSource);
      setActiveTab(0); // Reset to first tab for multi-source
    }
  }, [currentQuestionIndex, adaptiveQuestions, isDataInsights]);

  // Initialize questions (same logic as before)
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

  // Helper functions (same as before)
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

  // Format mathematical expressions with proper type checking
  const formatMath = (text) => {
    // Handle null, undefined, or empty values
    if (!text) return '';
    
    // Convert to string if it's not already a string
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
      // Check if all statements are answered
      return question.statements?.every((_, index) => 
        selectedAnswers[`${question.id}-${index}`] !== undefined
      ) || false;
    } else if (question.questionFormat === 'twoPartAnalysis') {
      // Check if both columns are answered
      return question.columns?.every((_, colIndex) => 
        selectedAnswers[`${question.id}-col${colIndex}`] !== undefined
      ) || false;
    } else {
      // Standard format - check if main question is answered
      return selectedAnswers[question.id] !== undefined;
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    setShowConfirmModal(true);
  };

  const confirmNext = () => {
    setShowConfirmModal(false);
    
    if (questionData.adaptiveMode) {
      updatePerformanceLevel();
    }
    
    if (currentQuestionIndex < adaptiveQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
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
    
    // Helper function to check if a question is answered correctly
    const isQuestionCorrect = (question) => {
      if (question.questionFormat === 'tableAnalysis') {
        // Check if all statements are answered correctly
        return question.statements?.every((statement, index) => 
          selectedAnswers[`${question.id}-${index}`] === statement.answer
        ) || false;
      } else if (question.questionFormat === 'twoPartAnalysis') {
        // Check if both columns are answered correctly
        if (!question.correctAnswer) return false;
        return question.columns?.every((_, colIndex) => {
          const correctKey = colIndex === 0 ? Object.keys(question.correctAnswer)[0] : Object.keys(question.correctAnswer)[1];
          const correctValue = question.correctAnswer[correctKey];
          return selectedAnswers[`${question.id}-col${colIndex}`] === correctValue;
        }) || false;
      } else {
        // Standard format
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
              {/* Simple graph representation */}
              <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                <strong>Y-Axis:</strong> {dataSource.data.yAxis} | <strong>X-Axis:</strong> {dataSource.data.xAxis}
              </div>
              
              {/* Legend */}
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
              
              {/* Simplified chart visualization */}
              <div style={{ flex: 1, position: 'relative', backgroundColor: 'white', border: '1px solid #ddd' }}>
                <svg width="100%" height="200" viewBox="0 0 400 200">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Data series */}
                  {dataSource.data.series.map((series, seriesIdx) => {
                    const points = series.points.map((point, idx) => ({
                      x: 50 + (idx * 50),
                      y: 180 - (point.y * 4) // Simple scaling
                    }));
                    
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

      case 'multiSource':
        const activeSource = dataSource.sources[activeTab];
        return (
          <div style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#2c3e50' }}>
              {dataSource.title}
            </h3>
            
            {/* Tabs */}
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
            
            {/* Tab content */}
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

  const currentQuestion = adaptiveQuestions[currentQuestionIndex];
  const isTimeWarning = timeRemaining <= timeLimit / 9;

  // Loading states and error handling (same as before)
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

  // Start screen (same as before but shows section type)
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

  // Completion screen (same as before but works for both section types)
  if (isCompleted) {
    const score = calculateScore();
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
                {questionData.testDescription || `This section tested your ${isDataInsights ? 'data analysis and interpretation' : 'quantitative reasoning'} abilities.`}
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
              GMAT {isDataInsights ? 'Data Insights' : 'Quantitative'} Score (60-90 scale)
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
                    let chosenAnswer, correctAnswer, isCorrect, isUnattempted;
                    
                    if (question.questionFormat === 'tableAnalysis') {
                      const allAnswered = question.statements?.every((_, idx) => selectedAnswers[`${question.id}-${idx}`]);
                      chosenAnswer = allAnswered ? 'Completed' : 'Incomplete';
                      correctAnswer = 'All statements';
                      isCorrect = question.statements?.every((statement, idx) => 
                        selectedAnswers[`${question.id}-${idx}`] === statement.answer
                      ) || false;
                      isUnattempted = !allAnswered;
                    } else if (question.questionFormat === 'twoPartAnalysis') {
                      const bothAnswered = question.columns?.every((_, colIdx) => selectedAnswers[`${question.id}-col${colIdx}`]);
                      chosenAnswer = bothAnswered ? 'Both columns' : 'Incomplete';
                      correctAnswer = 'Both correct';
                      isCorrect = question.columns?.every((_, colIdx) => {
                        const correctKey = colIdx === 0 ? Object.keys(question.correctAnswer || {})[0] : Object.keys(question.correctAnswer || {})[1];
                        const correctValue = (question.correctAnswer || {})[correctKey];
                        return selectedAnswers[`${question.id}-col${colIdx}`] === correctValue;
                      }) || false;
                      isUnattempted = !bothAnswered;
                    } else {
                      chosenAnswer = selectedAnswers[question.id] || '--';
                      correctAnswer = question.correctAnswer || '--';
                      isCorrect = chosenAnswer === correctAnswer;
                      isUnattempted = chosenAnswer === '--';
                    }
                    
                    const questionPreview = question.questionText.length > 50 
                      ? question.questionText.substring(0, 50) + '...'
                      : question.questionText;
                    
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
                            {question.questionFormat && (
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '10px',
                                color: '#666',
                                backgroundColor: '#f0f0f0',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                textTransform: 'uppercase'
                              }}>
                                {question.questionFormat}
                              </span>
                            )}
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

  // Main test interface - different layouts for Quant vs Data Insights
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

      {/* Main Content Area - Different layouts for Quant vs DI */}
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

              {/* Answer Options - Handle different question formats */}
              <div>
                {currentQuestion.questionFormat === 'tableAnalysis' ? (
                  // Table Analysis format
                  <div>
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <strong>Instructions:</strong> For each statement, select True, False, or Cannot be determined.
                    </div>
                    {currentQuestion.statements?.map((statement, index) => (
                      <div key={index} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                        <div style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '500' }}>
                          Statement {index + 1}: {statement.text}
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          {['True', 'False', 'Cannot be determined'].map((option) => (
                            <label key={option} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}-statement-${index}`}
                                value={option}
                                checked={selectedAnswers[`${currentQuestion.id}-${index}`] === option}
                                onChange={() => handleAnswerSelect(`${currentQuestion.id}-${index}`, option)}
                                style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                              />
                              <span style={{ fontSize: '14px' }}>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : currentQuestion.questionFormat === 'twoPartAnalysis' ? (
                  // Two-Part Analysis format
                  <div>
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <strong>Instructions:</strong> Select one option from each column.
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      {currentQuestion.columns?.map((column, colIndex) => (
                        <div key={colIndex} style={{ flex: 1 }}>
                          <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                            {column}
                          </h4>
                          {currentQuestion.options?.map((option, optIndex) => {
                            const optionKey = colIndex === 0 ? Object.keys(option)[0] : Object.keys(option)[1];
                            const optionValue = option[optionKey];
                            return (
                              <div key={optIndex} style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', padding: '8px', borderRadius: '4px', backgroundColor: selectedAnswers[`${currentQuestion.id}-col${colIndex}`] === optionValue ? '#fff3cd' : 'transparent' }}>
                                  <input
                                    type="radio"
                                    name={`question-${currentQuestion.id}-col${colIndex}`}
                                    value={optionValue}
                                    checked={selectedAnswers[`${currentQuestion.id}-col${colIndex}`] === optionValue}
                                    onChange={() => handleAnswerSelect(`${currentQuestion.id}-col${colIndex}`, optionValue)}
                                    style={{ marginRight: '10px', marginTop: '2px', transform: 'scale(1.2)' }}
                                  />
                                  <span style={{ fontSize: '14px', lineHeight: '1.4' }}>{optionValue}</span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Standard format with A-E options
                  currentQuestion.options && Object.entries(currentQuestion.options).map(([letter, text]) => (
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
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          // Quantitative Layout: Full width question area (original layout)
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
              <span style={{ color: '#2c3e50', fontSize: '18px', marginRight: '8px' }}>
                {currentQuestionIndex + 1}.
              </span>
              <span className="math-text" dangerouslySetInnerHTML={{ __html: formatMath(currentQuestion.questionText) }}></span>
            </div>

            {/* Answer Options - Handle different question formats */}
            <div style={{ maxWidth: '650px' }}>
              {currentQuestion.questionFormat === 'tableAnalysis' ? (
                // Table Analysis format
                <div>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <strong>Instructions:</strong> For each statement, select True, False, or Cannot be determined.
                  </div>
                  {currentQuestion.statements?.map((statement, index) => (
                    <div key={index} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
                      <div style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '500' }}>
                        Statement {index + 1}: {statement.text}
                      </div>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        {['True', 'False', 'Cannot be determined'].map((option) => (
                          <label key={option} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}-statement-${index}`}
                              value={option}
                              checked={selectedAnswers[`${currentQuestion.id}-${index}`] === option}
                              onChange={() => handleAnswerSelect(`${currentQuestion.id}-${index}`, option)}
                              style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                            />
                            <span style={{ fontSize: '14px' }}>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : currentQuestion.questionFormat === 'twoPartAnalysis' ? (
                // Two-Part Analysis format
                <div>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <strong>Instructions:</strong> Select one option from each column.
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {currentQuestion.columns?.map((column, colIndex) => (
                      <div key={colIndex} style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                          {column}
                        </h4>
                        {currentQuestion.options?.map((option, optIndex) => {
                          const optionKey = colIndex === 0 ? Object.keys(option)[0] : Object.keys(option)[1];
                          const optionValue = option[optionKey];
                          return (
                            <div key={optIndex} style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', padding: '8px', borderRadius: '4px', backgroundColor: selectedAnswers[`${currentQuestion.id}-col${colIndex}`] === optionValue ? '#fff3cd' : 'transparent' }}>
                                <input
                                  type="radio"
                                  name={`question-${currentQuestion.id}-col${colIndex}`}
                                  value={optionValue}
                                  checked={selectedAnswers[`${currentQuestion.id}-col${colIndex}`] === optionValue}
                                  onChange={() => handleAnswerSelect(`${currentQuestion.id}-col${colIndex}`, optionValue)}
                                  style={{ marginRight: '10px', marginTop: '2px', transform: 'scale(1.2)' }}
                                />
                                <span style={{ fontSize: '14px', lineHeight: '1.4' }}>{optionValue}</span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Standard format with A-E options
                currentQuestion.options && Object.entries(currentQuestion.options).map(([letter, text]) => (
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
                ))
              )}
            </div>
          </div>
        )}
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