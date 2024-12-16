from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import os

app = Flask(__name__)

# Diretório para armazenar os vídeos enviados
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        if 'video' not in request.files:
            return "Nenhum arquivo foi enviado", 400
        video = request.files['video']
        if video.filename == '':
            return "Nenhum arquivo selecionado", 400
        
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], video.filename)
        video.save(video_path)
        return redirect(url_for("index"))
    
    # Lista vídeos disponíveis
    videos = os.listdir(app.config['UPLOAD_FOLDER'])
    return render_template("index.html", videos=videos)

@app.route("/play/<filename>")
def play_video(filename):
    return render_template("player.html", video_url=url_for('uploaded_file', filename=filename))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == "__main__":
    app.run(debug=True)
