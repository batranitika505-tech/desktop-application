/**
 * Newton Athena — Examination Questions Dataset
 *
 * 10 Beginner-to-Intermediate Computer Science & Software Engineering questions.
 * Note: correctAnswer index is retained for future scoring evaluation,
 * but MUST NOT be exposed or rendered in the student's examination interface.
 */

export const questions = [
  {
    id: 1,
    question: 'What is the primary purpose of the async/await syntax in JavaScript?',
    options: [
      'To execute code synchronously by blocking the main event thread',
      'To handle asynchronous promises with cleaner, synchronous-like syntax',
      'To compile JavaScript code into native machine instructions',
      'To manage automatic garbage collection for background web workers',
    ],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: 'Which HTTP status code signifies that the requested resource could not be found on the server?',
    options: [
      '200 OK',
      '301 Moved Permanently',
      '404 Not Found',
      '500 Internal Server Error',
    ],
    correctAnswer: 2,
  },
  {
    id: 3,
    question: 'In Git, which command creates a new branch named "feature" and immediately switches to it?',
    options: [
      'git checkout -b feature',
      'git branch --switch feature',
      'git create feature',
      'git merge --new feature',
    ],
    correctAnswer: 0,
  },
  {
    id: 4,
    question: 'In React, what is the primary purpose of the useEffect hook?',
    options: [
      'To directly render and update HTML DOM nodes without reconciliation',
      'To synchronize a component with external systems and manage side effects',
      'To define global CSS styles for the root application component',
      'To replace all state variables with memoized cached values',
    ],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: 'What is the average time complexity for searching an element in a balanced Binary Search Tree (BST)?',
    options: [
      'O(1)',
      'O(n)',
      'O(log n)',
      'O(n log n)',
    ],
    correctAnswer: 2,
  },
  {
    id: 6,
    question: 'Which HTTP method is idempotent and intended to completely replace an existing resource with the request payload?',
    options: [
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ],
    correctAnswer: 1,
  },
  {
    id: 7,
    question: 'In operating systems, what is a "deadlock"?',
    options: [
      'A state where a thread terminates due to an unhandled hardware interrupt',
      'A situation where two or more processes are unable to proceed because each is waiting for the other to release a resource',
      'A memory leak that exhausts all available system swap space',
      'An unexpected CPU thermal throttle that halts all core execution',
    ],
    correctAnswer: 1,
  },
  {
    id: 8,
    question: 'In a relational database table, what does a PRIMARY KEY constraint enforce?',
    options: [
      'Values in the column must be unique and cannot be NULL',
      'Values in the column can be duplicated but must be indexed',
      'Values must automatically reference a foreign key in another table',
      'Values are encrypted before being written to disk',
    ],
    correctAnswer: 0,
  },
  {
    id: 9,
    question: 'Which built-in Python data structure is ordered and immutable?',
    options: [
      'List',
      'Dictionary',
      'Set',
      'Tuple',
    ],
    correctAnswer: 3,
  },
  {
    id: 10,
    question: 'In software testing, what is the primary purpose of regression testing?',
    options: [
      'To test how the system performs under extreme network load',
      'To verify that recent code changes have not adversely affected existing functional features',
      'To automatically generate user documentation from source code comments',
      'To measure execution time of database queries before deployment',
    ],
    correctAnswer: 1,
  },
];
