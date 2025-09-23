from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# 全局遊戲狀態
game_state = {
    'board': [[0 for _ in range(15)] for _ in range(15)],  # 0=空, 1=黑子, 2=白子
    'current_player': 1,  # 1=黑子, 2=白子
    'winner': None,
    'game_over': False
}

def check_winner(board, row, col, player):
    """檢查是否獲勝（五子連線）"""
    directions = [
        (0, 1),   # 水平
        (1, 0),   # 垂直
        (1, 1),   # 對角線
        (1, -1)   # 反對角線
    ]
    
    for dx, dy in directions:
        count = 1  # 包含當前棋子
        
        # 向一個方向檢查
        i, j = row + dx, col + dy
        while 0 <= i < 15 and 0 <= j < 15 and board[i][j] == player:
            count += 1
            i += dx
            j += dy
        
        # 向相反方向檢查
        i, j = row - dx, col - dy
        while 0 <= i < 15 and 0 <= j < 15 and board[i][j] == player:
            count += 1
            i -= dx
            j -= dy
        
        if count >= 5:
            return True
    
    return False

@app.route('/')
def index():
    """首頁 - 顯示棋盤"""
    return render_template('index.html')

@app.route('/move', methods=['POST'])
def make_move():
    """處理玩家落子"""
    global game_state
    
    data = request.get_json()
    x = data.get('x')
    y = data.get('y')
    
    # 驗證座標
    if not (0 <= x < 15 and 0 <= y < 15):
        return jsonify({'status': 'error', 'message': '無效的座標'})
    
    # 檢查位置是否已 occupied
    if game_state['board'][y][x] != 0:
        return jsonify({'status': 'error', 'message': '該位置已有棋子'})
    
    # 檢查遊戲是否已結束
    if game_state['game_over']:
        return jsonify({'status': 'error', 'message': '遊戲已結束'})
    
    # 放置棋子
    game_state['board'][y][x] = game_state['current_player']
    
    # 檢查是否獲勝
    if check_winner(game_state['board'], y, x, game_state['current_player']):
        game_state['winner'] = game_state['current_player']
        game_state['game_over'] = True
        winner_text = '黑子' if game_state['current_player'] == 1 else '白子'
        return jsonify({
            'status': 'ok',
            'board': game_state['board'],
            'current_player': game_state['current_player'],
            'winner': game_state['current_player'],
            'message': f'{winner_text}獲勝！'
        })
    
    # 切換玩家
    game_state['current_player'] = 2 if game_state['current_player'] == 1 else 1
    
    return jsonify({
        'status': 'ok',
        'board': game_state['board'],
        'current_player': game_state['current_player'],
        'winner': None
    })

@app.route('/reset', methods=['POST'])
def reset_game():
    """重置遊戲"""
    global game_state
    
    game_state = {
        'board': [[0 for _ in range(15)] for _ in range(15)],
        'current_player': 1,
        'winner': None,
        'game_over': False
    }
    
    return jsonify({
        'status': 'ok',
        'board': game_state['board'],
        'current_player': game_state['current_player'],
        'winner': None
    })

@app.route('/status')
def get_status():
    """獲取當前遊戲狀態"""
    return jsonify({
        'board': game_state['board'],
        'current_player': game_state['current_player'],
        'winner': game_state['winner'],
        'game_over': game_state['game_over']
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
