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
    skillsAssessed: [
      'Algebra and arithmetic',
      'Geometry and coordinate geometry',
      'Data analysis and probability'
    ],
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
      }
    ]
  };
  console.log('Using fallback mock data - questionData.json not found');
}

try {
  warmupData = require('./warmupData.json');
} catch (error) {
  console.log('warmupData.json not found - warmup mode disabled');
  warmupData = null;
}



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

  // Computed values
  const currentData = useMemo(() => {
    return isWarmupMode && warmupData ? warmupData : questionData;
  }, [isWarmupMode]);

  const targetQuestions = useMemo(() => {
    return isWarmupMode ? warmupQuestionCount : (currentData.targetQuestions || 21);
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
      const bookmarkArray = Array.from(bookmarkedQuestions).map(id => 
        adaptiveQuestions.find(q => q.id === id)
      );
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

  // Update current data source when question changes
  useEffect(() => {
    if (adaptiveQuestions.length > 0 && currentQuestion) {
      if (isDataInsights) {
        const dataSource = currentData.dataSources?.find(ds => ds.id === currentQuestion.dataSourceId);
        setCurrentDataSource(dataSource);
        setActiveTab(0);
      } else if (isVerbal && currentQuestion.passageId) {
        const passage = currentData.passages?.find(p => p.id === currentQuestion.passageId);
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
      const allQuestions = questionsPool.filter(q => !q.buffer);
      const bufferQuestions = questionsPool.filter(q => q.buffer);

      // Group questions by passage for verbal sections
      if (isVerbal) {
        const passageGroups = {};
        const crQuestions = [];

        allQuestions.forEach(q => {
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
          easy: [...allQuestions.filter(q => q.difficulty === 'easy')],
          medium: [...allQuestions.filter(q => q.difficulty === 'medium')],
          hard: [...allQuestions.filter(q => q.difficulty === 'hard')],
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
            const fallbackOrder = targetDifficulty === 'easy' ? ['medium', 'hard'] 
              : targetDifficulty === 'medium' ? ['easy', 'hard'] 
              : ['medium', 'easy'];

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
  
  return textStr
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
    .replace(/√\(([^)]+)\)/g, '<span style="font-size: 1.2em;">√</span><span style="text-decoration: overline;">$1</span>')
    
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
    .replace(/\\([a-zA-Z]+)/g, '$1'); // Remove LaTeX-style backslashes
}, []);

  // Event handlers
  const startTest = useCallback(() => {
    setTimeRemaining(timeLimit);
    setHasStarted(true);
    setTestStartTime(new Date());
    initializeAdaptiveQuestions();
  }, [initializeAdaptiveQuestions, timeLimit]);

  const handleAnswerSelect = useCallback((questionId, answer) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
  }, []);

  const isQuestionAnswered = useCallback((question) => {
    if (!question) return false;
    return selectedAnswers[question.id] !== undefined;
  }, [selectedAnswers]);

  const handleNext = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const confirmNext = useCallback(() => {
    setShowConfirmModal(false);

    // Record time spent on current question
    if (questionStartTime && currentQuestion) {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({ ...prev, [currentQuestion.id]: timeSpent }));
    }

    if (currentData.adaptiveMode && !isWarmupMode) {
      updatePerformanceLevel();
    }

    if (isReviewingBookmarks) {
      const bookmarkArray = Array.from(bookmarkedQuestions);
      if (bookmarkReviewIndex < bookmarkArray.length - 1) {
        setBookmarkReviewIndex(prev => prev + 1);
      } else {
        setIsCompleted(true);
      }
    } else {
      if (currentQuestionIndex < adaptiveQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
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
    isWarmupMode
  ]);

  const cancelNext = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const toggleBookmark = useCallback((questionId) => {
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

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

      adaptiveQuestions.forEach(question => {
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
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            GMAT™ Practice Test - {isDataInsights ? 'Data Insights' : isVerbal ? 'Verbal Reasoning' : 'Quantitative Reasoning'}
            {questionData.sectionName.includes('Development Mode') && (
              <span style={{ color: '#f39c12', marginLeft: '8px' }}>(DEV MODE)</span>
            )}
          </span>
          <span style={{ fontSize: '16px' }}>Ready to Begin</span>
        </div>

        <div style={{ backgroundColor: '#3498db', color: 'white', padding: '10px 22px', fontSize: '16px', fontWeight: '500' }}>
          {currentData.sectionName}
        </div>

        <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '700px' }}>
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
              <div style={{ backgroundColor: '#e8f4fd', padding: '20px', borderRadius: '6px', marginBottom: '25px', border: '2px solid #3498db' }}>
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
                        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '80px', fontSize: '16px', textAlign: 'center' }}
                      />
                    </label>
                    <div style={{ fontSize: '14px', color: '#888', marginTop: '5px' }}>
                      Choose 1-50 questions for practice
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '6px', marginBottom: '25px', textAlign: 'left' }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px', textAlign: 'center' }}>
                What This Test Covers
              </h3>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '15px', lineHeight: '1.6' }}>
                {currentData.testDescription || `This section tests your ${isDataInsights ? 'data analysis and interpretation' : 'quantitative reasoning'} abilities.`}
              </div>
              {currentData.skillsAssessed && currentData.skillsAssessed.length > 0 && (
                <div>
                  <strong style={{ color: '#2c3e50', fontSize: '16px' }}>Skills Assessed:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '16px', color: '#666', lineHeight: '1.6' }}>
                    {currentData.skillsAssessed.map((skill, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ fontSize: '18px', color: '#666', marginBottom: '25px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Time Limit:</strong>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customTimeLimit !== null ? customTimeLimit : Math.floor(defaultTimeLimit / 60)}
                    onChange={(e) => setCustomTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                    style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '80px', fontSize: '16px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '16px', color: '#666' }}>
                    minutes (default: {Math.floor(defaultTimeLimit / 60)})
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#888', marginTop: '5px' }}>
                  {customTimeLimit !== null ? `Custom time: ${customTimeLimit} minutes` : 'Using default timing'}
                </div>
              </div>
              <p><strong>Questions:</strong> {targetQuestions} {currentData.adaptiveMode && !isWarmupMode ? '(Adaptive)' : ''}</p>
              <p><strong>Section Type:</strong> {isDataInsights ? 'Data Insights' : isVerbal ? 'Verbal Reasoning' : 'Quantitative Reasoning'}</p>
              <p style={{ marginTop: '20px', fontSize: '16px', color: '#888' }}>
                {isWarmupMode 
                  ? 'This is a warmup session. Questions are selected for practice without adaptive difficulty adjustment.'
                  : currentData.adaptiveMode
                  ? 'This is an adaptive test. Question difficulty will adjust based on your performance. You can bookmark questions for review. Once you start, the timer will begin and you cannot go back to previous questions.'
                  : 'You can bookmark questions for review. Once you start, the timer will begin and you cannot go back to previous questions.'
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
                transition: 'background-color 0.2s ease',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#229954')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#27ae60')}
            >
              Start {isWarmupMode ? 'Warmup' : 'Test'}
            </button>
          </div>
        </div>
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
    // Time Pressure Graph Component - add this above your completion screen return
const renderTimePressureGraph = useCallback(() => {
  if (adaptiveQuestions.length === 0) return null;

  const graphWidth = 600;
  const graphHeight = 250;
  const padding = 40;
  const innerWidth = graphWidth - padding * 2;
  const innerHeight = graphHeight - padding * 2;

  // Calculate time data
  const timeData = adaptiveQuestions.map((question, index) => ({
    questionNum: index + 1,
    timeSpent: questionTimes[question.id] || 0,
    difficulty: question.difficulty,
  }));

  const maxTime = Math.max(...timeData.map((d) => d.timeSpent), 180); // At least 3 minutes scale
  const avgTime = timeData.reduce((sum, d) => sum + d.timeSpent, 0) / timeData.length;

  // Create points for the line
  const points = timeData.map((data, index) => {
    const x = padding + (index / (timeData.length - 1)) * innerWidth;
    const y = padding + (1 - data.timeSpent / maxTime) * innerHeight;
    return { x, y, ...data };
  });

  // Create hexadecimal averaging (moving average of 3)
  const smoothedPoints = points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point;

    const prev = points[index - 1];
    const next = points[index + 1];
    const avgY = (prev.y + point.y + next.y) / 3;

    return { ...point, y: avgY, smoothed: true };
  });

  const pathData = smoothedPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

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
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1" />
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

          {/* Y-axis labels (time) */}
          {[0, 1, 2, 3, 4, 5].map((minutes) => {
            const y = padding + (1 - (minutes * 60) / maxTime) * innerHeight;
            if (y >= padding && y <= graphHeight - padding) {
              return (
                <g key={minutes}>
                  <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="#666" strokeWidth="1" />
                  <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#666">
                    {minutes}m
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* X-axis labels (questions) */}
          {points
            .filter((_, i) => i % Math.ceil(points.length / 10) === 0)
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
                  Q{point.questionNum}
                </text>
              </g>
            ))}

          {/* Average time line */}
          <line
            x1={padding}
            y1={padding + (1 - avgTime / maxTime) * innerHeight}
            x2={graphWidth - padding}
            y2={padding + (1 - avgTime / maxTime) * innerHeight}
            stroke="#f39c12"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <text
            x={graphWidth - padding - 5}
            y={padding + (1 - avgTime / maxTime) * innerHeight - 5}
            textAnchor="end"
            fontSize="12"
            fill="#f39c12"
            fontWeight="bold"
          >
            Avg: {formatTime(Math.round(avgTime))}
          </text>

          {/* Time pressure zones */}
          <rect
            x={padding}
            y={padding}
            width={innerWidth}
            height={(1 - 150 / maxTime) * innerHeight}
            fill="rgba(231, 76, 60, 0.1)"
          />
          <text x={padding + 10} y={padding + 15} fontSize="12" fill="#e74c3c" fontWeight="bold">
            High Pressure Zone (2.5+ min)
          </text>

          {/* Main time line (smoothed) */}
          <path d={pathData} fill="none" stroke="#3498db" strokeWidth="3" strokeLinecap="round" />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill={point.timeSpent > 150 ? '#e74c3c' : point.timeSpent < 60 ? '#27ae60' : '#f39c12'}
                stroke="white"
                strokeWidth="2"
              />

              {/* Tooltip on hover */}
              <circle cx={point.x} cy={point.y} r="8" fill="transparent" style={{ cursor: 'pointer' }}>
                <title>
                  Q{point.questionNum}: {formatTime(point.timeSpent)} ({point.difficulty})
                </title>
              </circle>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          <span style={{ marginRight: '20px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: '#27ae60',
                borderRadius: '50%',
                marginRight: '5px',
              }}
            ></span>
            Fast (&lt;1min)
          </span>
          <span style={{ marginRight: '20px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: '#f39c12',
                borderRadius: '50%',
                marginRight: '5px',
              }}
            ></span>
            Normal (1-2.5min)
          </span>
          <span>
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: '#e74c3c',
                borderRadius: '50%',
                marginRight: '5px',
              }}
            ></span>
            Slow (&gt;2.5min)
          </span>
        </div>
      </div>
    </div>
  );
}, [adaptiveQuestions, questionTimes, formatTime]);

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            GMAT™ Practice Test - {isDataInsights ? 'Data Insights' : isVerbal ? 'Verbal Reasoning' : 'Quantitative Reasoning'}
            {isWarmupMode && <span style={{ color: '#f39c12', marginLeft: '8px' }}>(WARMUP)</span>}
          </span>
          <span style={{ fontSize: '16px' }}>Test Complete</span>
        </div>

        <div style={{ backgroundColor: '#3498db', color: 'white', padding: '10px 22px', fontSize: '16px', fontWeight: '500' }}>
          {currentData.sectionName}
        </div>

        <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#f8f9fa', overflow: 'auto' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '1200px', width: '100%' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '24px' }}>
              {isWarmupMode ? 'Warmup Results' : 'Test Results'}
            </h2>

            {testStartTime && (
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px', textAlign: 'center' }}>
                Test started: {testStartTime.toLocaleDateString()} at {testStartTime.toLocaleTimeString()}
              </div>
            )}

            {/* Score Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <div>
                <div style={{ fontSize: '48px', color: '#27ae60', fontWeight: 'bold' }}>{score.gmatScore}</div>
                <div style={{ fontSize: '16px', color: '#666' }}>Score (60-90)</div>
              </div>
              <div>
                <div style={{ fontSize: '48px', color: '#3498db', fontWeight: 'bold' }}>{score.accuracyPercentage}%</div>
                <div style={{ fontSize: '16px', color: '#666' }}>Overall Accuracy</div>
              </div>
              <div>
                <div style={{ fontSize: '48px', color: '#e67e22', fontWeight: 'bold' }}>{score.totalCorrect}/{score.totalQuestions}</div>
                <div style={{ fontSize: '16px', color: '#666' }}>Questions Correct</div>
              </div>
            </div>

            {/* Performance Level - only show for adaptive tests */}
            {currentData.adaptiveMode && !isWarmupMode && (
              <div style={{ fontSize: '18px', color: '#666', marginBottom: '25px' }}>
                Adaptive Performance Level:{' '}
                <strong style={{ color: score.performanceLevel === 'hard' ? '#27ae60' : score.performanceLevel === 'medium' ? '#f39c12' : '#e74c3c', textTransform: 'capitalize' }}>
                  {score.performanceLevel}
                </strong>
              </div>
            )}

            {/* Difficulty Breakdown */}
            <div style={{ textAlign: 'left', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '6px', marginBottom: '25px' }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', textAlign: 'center', fontSize: '18px' }}>
                Performance by Difficulty
              </h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
                <span style={{ color: '#27ae60', fontWeight: '500' }}>Easy:</span>
                <span>
                  {score.correctByDifficulty.easy}/{score.totalByDifficulty.easy} correct (
                  {score.totalByDifficulty.easy > 0 ? Math.round((score.correctByDifficulty.easy / score.totalByDifficulty.easy) * 100) : 0}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
                <span style={{ color: '#f39c12', fontWeight: '500' }}>Medium:</span>
                <span>
                  {score.correctByDifficulty.medium}/{score.totalByDifficulty.medium} correct (
                  {score.totalByDifficulty.medium > 0 ? Math.round((score.correctByDifficulty.medium / score.totalByDifficulty.medium) * 100) : 0}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                <span style={{ color: '#e74c3c', fontWeight: '500' }}>Hard:</span>
                <span>
                  {score.correctByDifficulty.hard}/{score.totalByDifficulty.hard} correct (
                  {score.totalByDifficulty.hard > 0 ? Math.round((score.correctByDifficulty.hard / score.totalByDifficulty.hard) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* Detailed Results Table */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '18px' }}>Detailed Question Analysis</h4>
              <div style={{ overflow: 'auto', maxHeight: '400px', border: '1px solid #ddd', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', backgroundColor: 'white' }}>
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
                        Time
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
                      <tr key={index} style={{ borderBottom: '1px solid #dee2e6', backgroundColor: result.isCorrect ? '#f8fff8' : '#fff5f5' }}>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>{result.sequenceNumber}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>{result.originalId}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: result.difficulty === 'easy' ? '#d4edda' : result.difficulty === 'medium' ? '#fff3cd' : '#f8d7da',
                            color: result.difficulty === 'easy' ? '#155724' : result.difficulty === 'medium' ? '#856404' : '#721c24',
                          }}>
                            {result.difficulty.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>{result.userAnswer}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>{result.correctAnswer}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>
                          <span style={{ color: result.timeSpent > 150 ? '#e74c3c' : result.timeSpent < 60 ? '#27ae60' : '#f39c12' }}>
                            {formatTime(result.timeSpent)}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ color: result.isCorrect ? '#27ae60' : '#e74c3c', fontWeight: 'bold', fontSize: '16px' }}>
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

  // Main test interface (simplified for space)
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: '500' }}>
          GMAT™ Practice Test - {isDataInsights ? 'Data Insights' : isVerbal ? 'Verbal Reasoning' : 'Quantitative Reasoning'}
          {isWarmupMode && <span style={{ color: '#f39c12', marginLeft: '8px' }}>(WARMUP)</span>}
        </span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', color: isTimeWarning ? '#e74c3c' : 'white', fontWeight: isTimeWarning ? 'bold' : 'normal' }}>
            {formatTime(timeRemaining)}
          </span>
          <span style={{ fontSize: '16px' }}>
            {currentQuestionIndex + 1} of {adaptiveQuestions.length}
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div style={{ backgroundColor: '#3498db', color: 'white', padding: '10px 22px', fontSize: '16px', fontWeight: '500' }}>
        {currentData.sectionName}
      </div>

      {/* Main Content Area - Simplified single column layout */}
      <div style={{ flex: 1, padding: '35px 45px', overflow: 'auto' }}>
        {/* Question Text */}
        {currentQuestion && (
          <div style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '35px', color: '#2c3e50' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
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
            <span dangerouslySetInnerHTML={{ __html: formatMath(currentQuestion.questionText) }}></span>
          </div>
        )}

        {/* Answer Options */}
        {currentQuestion && (
          <div style={{ maxWidth: '650px' }}>
            {currentQuestion.options && Object.entries(currentQuestion.options).map(([letter, text]) => (
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
                  border: selectedAnswers[currentQuestion.id] === letter ? '2px solid #ffc107' : '2px solid transparent',
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
                  <span style={{ fontSize: '18px', lineHeight: '1.4' }} dangerouslySetInnerHTML={{ __html: formatMath(text) }}></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{ backgroundColor: '#3498db', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{ backgroundColor: 'transparent', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
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
     // Enhanced pause modal with blur effect - replace your existing pause modal
{isPaused && (
  <div style={{ 
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
    animation: 'fadeIn 0.3s ease-in-out'
  }}>
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
        width: '90%'
      }}
    >
      <div style={{ 
        fontSize: '48px', 
        marginBottom: '20px',
        color: '#3498db'
      }}>
        ⏸️
      </div>
      <h3 style={{ 
        color: '#2c3e50', 
        marginBottom: '15px', 
        fontSize: '24px',
        fontWeight: '600'
      }}>
        Test Paused
      </h3>
      <p style={{ 
        marginBottom: '25px', 
        color: '#666', 
        fontSize: '16px',
        lineHeight: '1.5'
      }}>
        Your test is paused. The timer is stopped.<br />
        Click Resume when you're ready to continue.
      </p>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '25px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
          Time Remaining
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#495057' }}>
          {formatTime(timeRemaining)}
        </div>
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
          boxShadow: '0 2px 4px rgba(39, 174, 96, 0.3)'
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '8px', textAlign: 'center', maxWidth: '450px' }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '20px' }}>Time Warning</h3>
            <p style={{ marginBottom: '20px', color: '#666', fontSize: '16px' }}>
              You have {Math.ceil(timeRemaining / 60)} minutes remaining.
            </p>
            <button
              onClick={() => setShowTimeWarning(false)}
              style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', minWidth: '450px', maxWidth: '520px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #dee2e6' }}>
            <div style={{ backgroundColor: '#3498db', color: 'white', padding: '14px 22px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: '500' }}>Response Confirmation</span>
              <button
                onClick={cancelNext}
                style={{ backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '2px 6px', borderRadius: '3px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '25px' }}>
                <div style={{ backgroundColor: '#3498db', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', marginRight: '15px', marginTop: '2px', flexShrink: 0 }}>
                  i
                </div>
                <div>
                  <div style={{ fontSize: '18px', color: '#2c3e50', fontWeight: '500', marginBottom: '15px' }}>
                    Have you completed your response?
                  </div>
                  <div style={{ fontSize: '16px', color: '#666', lineHeight: '1.4' }}>
                    Click <strong>Yes</strong> to {currentQuestionIndex === adaptiveQuestions.length - 1 ? 'see your results' : 'move to the next question'}.<br />
                    Click <strong>No</strong> to continue responding to this question.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '25px' }}>
                <button
                  onClick={confirmNext}
                  style={{ backgroundColor: 'white', color: '#333', border: '1px solid #ddd', padding: '10px 30px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', minWidth: '90px', transition: 'all 0.2s ease' }}
                >
                  Yes
                </button>
                <button
                  onClick={cancelNext}
                  style={{ backgroundColor: 'white', color: '#333', border: '1px solid #ddd', padding: '10px 30px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', minWidth: '90px', transition: 'all 0.2s ease' }}
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