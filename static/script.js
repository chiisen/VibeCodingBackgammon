// 遊戲狀態管理
class GomokuGame {
    constructor() {
        this.board = null;
        this.currentPlayer = 1; // 1 = 黑子, 2 = 白子
        this.gameOver = false;
        this.winner = null;
        this.boardSize = 15;
        
        this.initializeBoard();
        this.bindEvents();
        this.updatePlayerDisplay();
    }
    
    // 初始化棋盤
    initializeBoard() {
        this.board = document.getElementById('game-board');
        this.board.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                intersection.dataset.row = row;
                intersection.dataset.col = col;
                intersection.addEventListener('click', () => this.makeMove(row, col));
                this.board.appendChild(intersection);
            }
        }
    }
    
    // 綁定事件
    bindEvents() {
        // 重新開始按鈕
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // 關於按鈕
        document.getElementById('about-btn').addEventListener('click', () => {
            this.showAboutModal();
        });
        
        // 模態框關閉按鈕
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.hideWinnerModal();
        });
        
        document.getElementById('close-about-btn').addEventListener('click', () => {
            this.hideAboutModal();
        });
        
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.hideWinnerModal();
            this.resetGame();
        });
        
        // 點擊模態框背景關閉
        document.getElementById('winner-modal').addEventListener('click', (e) => {
            if (e.target.id === 'winner-modal') {
                this.hideWinnerModal();
            }
        });
        
        document.getElementById('about-modal').addEventListener('click', (e) => {
            if (e.target.id === 'about-modal') {
                this.hideAboutModal();
            }
        });
    }
    
    // 落子
    async makeMove(row, col) {
        if (this.gameOver) {
            this.showError('遊戲已結束，請重新開始');
            return;
        }
        
        // 檢查該位置是否已有棋子
        const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (intersection.querySelector('.piece')) {
            this.showError('該位置已有棋子');
            return;
        }
        
        try {
            const response = await fetch('/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    x: col,
                    y: row
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'ok') {
                // 更新前端棋盤
                this.updateBoard(data.board);
                this.currentPlayer = data.current_player;
                this.updatePlayerDisplay();
                
                // 檢查是否有獲勝者
                if (data.winner) {
                    this.gameOver = true;
                    this.winner = data.winner;
                    this.showWinnerModal(data.message);
                    this.addWinnerAnimation(data.board, data.winner);
                }
            } else {
                this.showError(data.message || '落子失敗');
            }
        } catch (error) {
            console.error('Error making move:', error);
            this.showError('網路錯誤，請重試');
        }
    }
    
    // 更新棋盤顯示
    updateBoard(board) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const existingPiece = intersection.querySelector('.piece');
                
                if (existingPiece) {
                    existingPiece.remove();
                }
                
                if (board[row][col] !== 0) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${board[row][col] === 1 ? 'black' : 'white'}`;
                    intersection.appendChild(piece);
                }
            }
        }
    }
    
    // 更新玩家顯示
    updatePlayerDisplay() {
        const display = document.getElementById('current-player-display');
        const playerText = this.currentPlayer === 1 ? '黑子' : '白子';
        display.textContent = playerText;
        display.className = this.currentPlayer === 1 ? 'black' : 'white';
    }
    
    // 重置遊戲
    async resetGame() {
        try {
            const response = await fetch('/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'ok') {
                this.currentPlayer = data.current_player;
                this.gameOver = false;
                this.winner = null;
                this.updateBoard(data.board);
                this.updatePlayerDisplay();
                this.clearError();
                this.removeWinnerAnimation();
            } else {
                this.showError('重置遊戲失敗');
            }
        } catch (error) {
            console.error('Error resetting game:', error);
            this.showError('網路錯誤，請重試');
        }
    }
    
    // 顯示獲勝模態框
    showWinnerModal(message) {
        document.getElementById('winner-message').textContent = message;
        document.getElementById('winner-modal').style.display = 'block';
    }
    
    // 隱藏獲勝模態框
    hideWinnerModal() {
        document.getElementById('winner-modal').style.display = 'none';
    }
    
    // 顯示關於模態框
    showAboutModal() {
        document.getElementById('about-modal').style.display = 'block';
    }
    
    // 隱藏關於模態框
    hideAboutModal() {
        document.getElementById('about-modal').style.display = 'none';
    }
    
    // 顯示錯誤訊息
    showError(message) {
        // 移除現有的錯誤訊息
        this.clearError();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(errorDiv, container.firstChild);
        
        // 3秒後自動移除
        setTimeout(() => {
            this.clearError();
        }, 3000);
    }
    
    // 清除錯誤訊息
    clearError() {
        const errorMessage = document.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
    
    // 添加獲勝動畫
    addWinnerAnimation(board, winner) {
        // 找到獲勝的五子並添加動畫
        const pieces = document.querySelectorAll('.piece');
        pieces.forEach(piece => {
            if (piece.classList.contains(winner === 1 ? 'black' : 'white')) {
                piece.classList.add('winner-animation');
            }
        });
    }
    
    // 移除獲勝動畫
    removeWinnerAnimation() {
        const animatedPieces = document.querySelectorAll('.winner-animation');
        animatedPieces.forEach(piece => {
            piece.classList.remove('winner-animation');
        });
    }
    
    // 獲取遊戲狀態
    async getGameStatus() {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            this.currentPlayer = data.current_player;
            this.winner = data.winner;
            this.gameOver = data.game_over;
            
            this.updateBoard(data.board);
            this.updatePlayerDisplay();
            
            if (this.gameOver && this.winner) {
                const winnerText = this.winner === 1 ? '黑子' : '白子';
                this.showWinnerModal(`${winnerText}獲勝！`);
            }
        } catch (error) {
            console.error('Error getting game status:', error);
        }
    }
}

// 頁面載入完成後初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GomokuGame();
    
    // 定期同步遊戲狀態（防止頁面刷新後狀態不一致）
    setInterval(() => {
        if (!window.game.gameOver) {
            window.game.getGameStatus();
        }
    }, 5000);
});

// 鍵盤快捷鍵
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // ESC 鍵關閉模態框
        if (window.game) {
            window.game.hideWinnerModal();
            window.game.hideAboutModal();
        }
    } else if (e.key === 'r' || e.key === 'R') {
        // R 鍵重新開始遊戲
        if (window.game && !window.game.gameOver) {
            window.game.resetGame();
        }
    }
});

// 防止頁面刷新時丟失遊戲狀態的警告
window.addEventListener('beforeunload', (e) => {
    if (window.game && !window.game.gameOver) {
        e.preventDefault();
        e.returnValue = '遊戲進行中，確定要離開嗎？';
        return e.returnValue;
    }
});
