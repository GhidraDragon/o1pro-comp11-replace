import React, { useState, useEffect } from 'react';
import './Game.css';

const ROWS = 6;
const COLS = 7;

export default function Game() {
  // scoreboard
  const [humanWins, setHumanWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);

  // board
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('R');
  const [status, setStatus] = useState('Welcome! Click a column to drop a piece.');
  const [gameOver, setGameOver] = useState(false);

  // On mount: parse cookies for scoreboard
  useEffect(() => {
    const cookies = parseCookies();
    if (cookies.pdfsage_humanWins) {
      setHumanWins(parseInt(cookies.pdfsage_humanWins, 10));
    }
    if (cookies.pdfsage_aiWins) {
      setAiWins(parseInt(cookies.pdfsage_aiWins, 10));
    }
  }, []);

  // Column button click
  const handleColumnClick = (col) => {
    if (gameOver) return;

    const newBoard = dropPiece(board, col, 'R');
    if (!newBoard) return; // column is full, do nothing

    setBoard(newBoard);
    const result = evaluateBoard(newBoard);
    if (checkGameEnd(result, 'R')) return;

    setCurrentPlayer('Y');
    setStatus('AI is thinking...');

    setTimeout(() => {
      const aiBoard = aiMove(newBoard);
      setBoard(aiBoard);
      const finalRes = evaluateBoard(aiBoard);
      if (!checkGameEnd(finalRes, 'Y')) {
        setStatus('Your turn!');
        setCurrentPlayer('R');
      }
    }, 600);
  };

  // AI moves
  const aiMove = (currentBoard) => {
    const bestCol = getBestMove(currentBoard, 'Y', 'R');
    if (bestCol === null) {
      setStatus("No more moves—it's a draw!");
      setGameOver(true);
      return currentBoard;
    }
    const newBoard = dropPiece(currentBoard, bestCol, 'Y');
    return newBoard || currentBoard;
  };

  // Check if the game ended
  const checkGameEnd = (result, player) => {
    if (result === `${player}_wins`) {
      if (player === 'R') {
        setStatus('You win! Congrats!');
        setHumanWins((prev) => {
          const newVal = prev + 1;
          setCookie('pdfsage_humanWins', newVal, 365);
          return newVal;
        });
      } else {
        setStatus('AI wins! Better luck next time.');
        setAiWins((prev) => {
          const newVal = prev + 1;
          setCookie('pdfsage_aiWins', newVal, 365);
          return newVal;
        });
      }
      setGameOver(true);
      return true;
    }
    if (result === 'draw') {
      setStatus("It's a draw!");
      setGameOver(true);
      return true;
    }
    return false;
  };

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('R');
    setStatus('New game—your turn!');
    setGameOver(false);
  };

  return (
    <div className="connect4-container">
      <h1 className="connect4-title">Connect 4</h1>

      {/* Explanation + Plans */}
      <section className="connect4-intro-box">
        <h2>Why Connect 4?</h2>
        <p>
          Our webmaster created Connect 4 from scratch in C++ 
          for <strong>comp11 (Intro to CS)</strong> at Tufts University—
          it was 1/3 of the assignments for that class. The toughest part 
          was coding the AI logic from scratch. Now, we plan to integrate 
          a <strong>AlphaZero</strong> AI approach for self-play training soon, 
          and even offer automatic crypto payouts for anyone who manages to beat 
          the AI. For more info, contact <strong>bo@shang.software</strong>.
        </p>
      </section>

      {/* Scoreboard */}
      <div className="scoreboard">
        <p>
          <strong>Your Wins:</strong> {humanWins} &nbsp;|&nbsp; 
          <strong>AI Wins:</strong> {aiWins}
        </p>
      </div>

      <p className="connect4-status">{status}</p>

      <div className="connect4-grid">
        {/* row of drop buttons */}
        <div className="connect4-columns">
          {Array.from({ length: COLS }, (_, col) => (
            <button
              key={`col-${col}`}
              className="connect4-column-button"
              onClick={() => handleColumnClick(col)}
            >
              Drop
            </button>
          ))}
        </div>

        {/* Board from top row=0 to bottom row=5 */}
        <div className="connect4-board">
          {board.map((rowArray, row) => (
            <div key={`row-${row}`} className="connect4-row">
              {rowArray.map((cell, col) => {
                const discClass = cell === 'R' ? 'red disc-animate'
                                  : cell === 'Y' ? 'yellow disc-animate'
                                  : '';
                return (
                  <div
                    key={`cell-${row}-${col}`}
                    className={`connect4-cell ${discClass}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {gameOver && (
        <button className="reset-button" onClick={handleReset}>
          New Game
        </button>
      )}
    </div>
  );
}

/* ================== Board + AI Logic ================== */
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function dropPiece(board, col, player) {
  const newBoard = board.map((r) => [...r]);
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!newBoard[row][col]) {
      newBoard[row][col] = player;
      return newBoard;
    }
  }
  return null; // column is full
}

function evaluateBoard(board) {
  if (checkFourInARow(board, 'R')) return 'R_wins';
  if (checkFourInARow(board, 'Y')) return 'Y_wins';
  const isFull = board.every(r => r.every(cell => cell !== null));
  if (isFull) return 'draw';
  return 'ongoing';
}

function checkFourInARow(board, player) {
  // horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (
        board[r][c] === player &&
        board[r][c+1] === player &&
        board[r][c+2] === player &&
        board[r][c+3] === player
      ) return true;
    }
  }
  // vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      if (
        board[r][c] === player &&
        board[r+1][c] === player &&
        board[r+2][c] === player &&
        board[r+3][c] === player
      ) return true;
    }
  }
  // diag down-right
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (
        board[r][c] === player &&
        board[r+1][c+1] === player &&
        board[r+2][c+2] === player &&
        board[r+3][c+3] === player
      ) return true;
    }
  }
  // diag down-left
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 3; c < COLS; c++) {
      if (
        board[r][c] === player &&
        board[r+1][c-1] === player &&
        board[r+2][c-2] === player &&
        board[r+3][c-3] === player
      ) return true;
    }
  }
  return false;
}

function getBestMove(board, aiPlayer, humanPlayer) {
  let bestScore = -Infinity;
  let bestCol = null;
  for (let col = 0; col < COLS; col++) {
    if (!columnIsFull(board, col)) {
      const newBoard = dropPiece(board, col, aiPlayer);
      if (!newBoard) continue;
      const score = scoreMove(board, newBoard, aiPlayer, humanPlayer);
      if (score > bestScore) {
        bestScore = score;
        bestCol = col;
      }
    }
  }
  return bestCol;
}

function columnIsFull(board, col) {
  return board[0][col] !== null;
}

function scoreMove(_oldBoard, newBoard, aiPlayer, humanPlayer) {
  if (checkFourInARow(newBoard, aiPlayer)) {
    return 100000;
  }
  let baseScore = 0;
  if (opponentCanWinNextMove(newBoard, humanPlayer)) {
    baseScore -= 95000;
  }
  if (opponentCanFormConnect3(newBoard, humanPlayer)) {
    baseScore -= 92000;
  }
  baseScore += 100 * countThrees(newBoard, aiPlayer);
  baseScore -= 90 * countThrees(newBoard, humanPlayer);
  return baseScore;
}

function opponentCanWinNextMove(board, opp) {
  for (let c = 0; c < COLS; c++) {
    if (!columnIsFull(board, c)) {
      const testBoard = dropPiece(board, c, opp);
      if (testBoard && checkFourInARow(testBoard, opp)) {
        return true;
      }
    }
  }
  return false;
}

function opponentCanFormConnect3(board, opp) {
  for (let c = 0; c < COLS; c++) {
    if (!columnIsFull(board, c)) {
      const testBoard = dropPiece(board, c, opp);
      if (testBoard && countThrees(testBoard, opp) > 0) {
        return true;
      }
    }
  }
  return false;
}

function countThrees(board, player) {
  let total = 0;
  // horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const window = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
      total += checkThreeWindow(window, player);
    }
  }
  // vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      const window = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
      total += checkThreeWindow(window, player);
    }
  }
  // diag down-right
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const window = [
        board[r][c],
        board[r+1][c+1],
        board[r+2][c+2],
        board[r+3][c+3]
      ];
      total += checkThreeWindow(window, player);
    }
  }
  // diag down-left
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 3; c < COLS; c++) {
      const window = [
        board[r][c],
        board[r+1][c-1],
        board[r+2][c-2],
        board[r+3][c-3]
      ];
      total += checkThreeWindow(window, player);
    }
  }
  return total;
}

function checkThreeWindow(window, player) {
  const countP = window.filter(x => x === player).length;
  const countNull = window.filter(x => x === null).length;
  if (countP === 3 && countNull === 1) {
    return 1;
  }
  return 0;
}

/* Cookies */
function parseCookies() {
  const cookieObj = {};
  const all = document.cookie.split(';');
  for (let c of all) {
    const [key, val] = c.trim().split('=');
    if (key && val) {
      cookieObj[key] = decodeURIComponent(val);
    }
  }
  return cookieObj;
}
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days*24*60*60*1000));
  const expires = "expires="+ d.toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}