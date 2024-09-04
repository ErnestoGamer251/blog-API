document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');

    // Obtener y mostrar las publicaciones
    fetch('http://localhost:3000/posts')
        .then(response => response.json())
        .then(posts => {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.content}</p>
                    <div id="comments-${post.id}"></div>
                    <textarea id="comment-${post.id}" placeholder="Add a comment..."></textarea>
                    <button onclick="addComment(${post.id})">Post Comment</button>
                `;
                postsContainer.appendChild(postElement);
                loadComments(post.id);
            });
        });

    // Cargar comentarios de una publicación
    function loadComments(postId) {
        fetch(`http://localhost:3000/posts/${postId}/comments`)
            .then(response => response.json())
            .then(comments => {
                const commentsContainer = document.getElementById(`comments-${postId}`);
                commentsContainer.innerHTML = comments.map(comment => `
                    <p><strong>${comment.author.username}</strong>: ${comment.content}</p>
                `).join('');
            });
    }

    // Agregar un nuevo comentario
    window.addComment = function(postId) {
        const commentContent = document.getElementById(`comment-${postId}`).value;
        const token = localStorage.getItem('token');

        fetch(`http://localhost:3000/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: commentContent })
        })
        .then(response => {
            if (response.ok) {
                loadComments(postId);
                document.getElementById(`comment-${postId}`).value = '';
            } else {
                alert('Failed to post comment. Make sure you are logged in.');
            }
        });
    }
});
