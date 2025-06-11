# GMAT Practice Test System

A comprehensive React-based practice test interface supporting all three GMAT Focus Edition sections: Quantitative Reasoning, Data Insights, and Verbal Reasoning.

## Project Attribution

**Concept & Design**: Original idea and specifications by jakradum  
**Implementation**: Built with Claude (Anthropic's AI assistant) as coding partner

This project demonstrates collaborative human-AI development - the vision, requirements, and testing were human-driven, while Claude handled the technical implementation and React development.

## Features

### Test Sections Supported
- **Quantitative Reasoning**: Full-width layout with mathematical formatting and visual elements
- **Data Insights**: Split layout with data visualizations (graphs, tables, multi-source) on left, questions on right
- **Verbal Reasoning**: 
  - Reading Comprehension: Split layout with numbered passages on left, questions on right
  - Critical Reasoning: Full-width layout for standalone questions

### Advanced Features
- **Adaptive Testing**: Dynamic difficulty adjustment based on performance
- **Custom Timing**: Set your own time limits or use section defaults
- **Bookmark System**: Mark questions for review with visual indicators
- **Edit Previous**: Limited ability to revise previous answers (1/7th ratio)
- **Time Pressure Analysis**: Visual graph showing response times and patterns
- **Performance Analytics**: Detailed scoring and difficulty breakdowns
- **Question Types**: Support for multiple choice, table analysis, two-part analysis, and more

## Quick Start

### Prerequisites
- Node.js 14+ and npm

### Installation
```bash
git clone https://github.com/jakradum/gmat-practice-interfact
cd gmat-practice-test
npm install
npm start
```

The application will run on `http://localhost:3000`

### Setting Up Questions

Create a `questionData.json` file in the `src` directory with your test content. See examples below for each section type.

## JSON Configuration Examples

### Quantitative Reasoning
```json
{
  "sectionName": "GMAT Quantitative Practice",
  "sectionType": "quantitative",
  "testDescription": "This section tests mathematical reasoning and problem-solving abilities.",
  "skillsAssessed": [
    "Algebra and arithmetic",
    "Geometry and coordinate geometry", 
    "Data analysis and probability"
  ],
  "adaptiveMode": true,
  "targetQuestions": 21,
  "timeLimit": 2700,
  "questions": [
    {
      "id": 1,
      "questionText": "If 3x + 7 = 22, what is the value of x^2 + 2x?",
      "difficulty": "medium",
      "options": {
        "A": "15",
        "B": "20", 
        "C": "25",
        "D": "30",
        "E": "35"
      },
      "correctAnswer": "C",
      "visual": {
        "type": "equation",
        "content": "3x + 7 = 22"
      }
    }
  ]
}
```

### Data Insights
```json
{
  "sectionName": "GMAT Data Insights Practice",
  "sectionType": "dataInsights", 
  "testDescription": "This section tests data interpretation and analysis abilities.",
  "adaptiveMode": true,
  "targetQuestions": 20,
  "timeLimit": 2700,
  "dataSources": [
    {
      "id": "graph1",
      "type": "graph",
      "title": "Company Revenue by Quarter",
      "data": {
        "type": "line",
        "xAxis": "Quarter",
        "yAxis": "Revenue ($ millions)",
        "series": [
          {
            "name": "Product A",
            "color": "#3498db",
            "points": [
              {"x": "Q1 2020", "y": 15},
              {"x": "Q2 2020", "y": 18}
            ]
          }
        ]
      }
    }
  ],
  "questions": [
    {
      "id": 1,
      "dataSourceId": "graph1",
      "questionText": "What was the approximate revenue for Product A in Q1 2020?",
      "difficulty": "easy",
      "options": {
        "A": "$10 million",
        "B": "$15 million",
        "C": "$20 million"
      },
      "correctAnswer": "B"
    }
  ]
}
```

### Verbal Reasoning
```json
{
  "sectionName": "GMAT Verbal Practice",
  "sectionType": "verbal",
  "testDescription": "This section tests reading comprehension and critical reasoning skills.",
  "adaptiveMode": true,
  "targetQuestions": 23,
  "timeLimit": 3900,
  "passages": [
    {
      "id": "passage1", 
      "title": "Economic Theory",
      "content": "Traditional economic theory assumes that markets operate efficiently when left to their own devices. This assumption, known as the efficient market hypothesis, suggests that prices reflect all available information.\n\nHowever, behavioral economists have challenged this view by demonstrating that human psychology significantly influences economic decisions."
    }
  ],
  "questions": [
    {
      "id": 1,
      "passageId": "passage1",
      "questionText": "The primary purpose of the passage is to:",
      "difficulty": "medium", 
      "options": {
        "A": "Explain traditional economic theory",
        "B": "Present contrasting economic views",
        "C": "Prove behavioral economics is superior"
      },
      "correctAnswer": "B"
    },
    {
      "id": 2,
      "questionText": "Which strengthens the argument that markets are inefficient?",
      "difficulty": "hard",
      "options": {
        "A": "Evidence of rational investor behavior",
        "B": "Data showing market bubbles",
        "C": "Research supporting efficient markets"
      },
      "correctAnswer": "B"
    }
  ]
}
```

## Configuration Options

### Core Fields
- **sectionName**: Display name for your test
- **sectionType**: `"quantitative"`, `"dataInsights"`, or `"verbal"`
- **testDescription**: Brief description shown on start screen
- **skillsAssessed**: Array of skills being tested
- **adaptiveMode**: Enable/disable adaptive difficulty
- **targetQuestions**: Number of questions in test
- **timeLimit**: Custom time limit in seconds (optional)

### Section-Specific Fields

#### Data Insights
- **dataSources**: Array of data visualizations (graphs, tables, text, multi-source)

#### Verbal Reasoning  
- **passages**: Array of reading passages with line numbering

### Question Properties
- **id**: Unique identifier
- **questionText**: The question content
- **difficulty**: `"easy"`, `"medium"`, or `"hard"`
- **options**: Object with answer choices (A, B, C, D, E)
- **correctAnswer**: The correct option letter
- **buffer**: Boolean for buffer questions in adaptive mode
- **dataSourceId**: (Data Insights) Links to data source
- **passageId**: (Verbal RC) Links to reading passage
- **visual**: (Quantitative) Visual elements like diagrams, tables

## Visual Elements (Quantitative)

### Supported Types
- **table**: Data tables with headers and rows
- **diagram**: SVG-based geometric diagrams  
- **equation**: Mathematical expressions with formatting
- **coordinate**: Coordinate plane with plotting capabilities

### Example Visual Element
```json
{
  "visual": {
    "type": "table",
    "title": "Sales Data",
    "data": {
      "headers": ["Quarter", "Revenue", "Growth"],
      "rows": [
        ["Q1", "$100M", "5%"],
        ["Q2", "$110M", "10%"]
      ]
    }
  }
}
```

## Data Source Types (Data Insights)

### Graph
Line charts with multiple series, customizable colors and scaling
```json
{
  "type": "graph",
  "data": {
    "type": "line",
    "xAxis": "Time Period", 
    "yAxis": "Value",
    "series": [...]
  }
}
```

### Table
Professional data tables with alternating row colors
```json
{
  "type": "table", 
  "data": {
    "headers": ["Column 1", "Column 2"],
    "rows": [["Data 1", "Data 2"]]
  }
}
```

### Multi-Source
Tabbed interface combining multiple data types
```json
{
  "type": "multiSource",
  "sources": [
    {"tabName": "Survey", "type": "text", "content": "..."},
    {"tabName": "Data", "type": "table", "data": {...}}
  ]
}
```

## Advanced Features

### Adaptive Algorithm
- Adjusts question difficulty based on recent performance
- Weighted scoring with early question bonuses
- Performance level tracking (easy/medium/hard)

### Time Management
- Section-specific default timing
- Custom time limits with user input
- Time pressure visualization and analysis
- Warning alerts at 1/9th time remaining

### Analytics & Reporting
- **Performance by Difficulty**: Accuracy breakdown by question difficulty
- **Time Pressure Graph**: Visual analysis of response times with hexadecimal averaging
- **Question Type Analysis**: Performance patterns by question format (RC vs CR for Verbal)
- **Detailed Results Table**: Complete question-by-question breakdown with timing

### User Experience
- **Bookmark System**: Mark questions for end-of-test review
- **Edit Previous**: Limited ability to revise answers (1/7th of questions)
- **Mathematical Formatting**: Automatic rendering of mathematical expressions
- **Responsive Design**: Optimized layouts for different screen sizes

## Technical Architecture

### Built With
- **React 18+** with modern hooks (useState, useEffect, useCallback, useMemo)
- **No external dependencies** beyond React
- **SVG-based visualizations** for data graphics
- **Local state management** (no browser storage)

### Performance Optimizations
- Memoized functions with useCallback to prevent re-renders
- Optimized state management with useMemo for computed values
- Efficient component rendering with proper dependency arrays
- Memory cleanup for timers and event listeners

### Browser Compatibility
- Modern ES6+ features
- SVG support required for data visualizations
- No external storage dependencies
- Touch and mouse interaction support

## Development

### File Structure
```
src/
├── questionData.json      # Your test content
├── GMATInterface.js       # Main component  
└── index.js              # App entry point
```

### Key Functions
- **initializeAdaptiveQuestions**: Handles question selection and ordering
- **renderDataSource**: Renders data visualizations for DI section
- **renderPassage**: Renders reading passages with line numbers
- **calculateScore**: Implements adaptive scoring algorithm

### Customization
- Modify scoring algorithms in `calculateScore`
- Add new visual types in `renderQuestionVisual`
- Extend data source types in `renderDataSource`
- Customize timing defaults for different sections

## Contributing

This is an open-source GMAT practice tool. Contributions welcome for:
- Additional question formats
- New data visualization types
- Enhanced analytics and reporting
- Mobile optimization improvements
- Accessibility enhancements

## License

MIT License - free to use, modify, and distribute.

---

**Note**: This tool is for practice purposes only and is not affiliated with or endorsed by GMAC or the official GMAT exam.