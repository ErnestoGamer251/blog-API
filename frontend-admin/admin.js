// admin.js
document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const newPostForm = document.getElementById('new-post-form');
    const logoutButton = document.getElementById('logout-button');

    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }

    // Función para cargar los posts
    function loadPosts() {
        fetch('http://localhost:3000/admin/posts', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(posts => {
            postsContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.content}</p>
                    <p><strong>${post.published ? 'Published' : 'Unpublished'}</strong></p>
                    <button onclick="togglePublish(${post.id}, ${post.published})">${post.published ? 'Unpublish' : 'Publish'}</button>
                    <button onclick="deletePost(${post.id})">Delete</button>
                `;
                postsContainer.appendChild(postElement);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load posts.');
        });
    }

    loadPosts();

    // Crear nueva publicación
    newPostForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const published = document.getElementById('published').checked;

        fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content, published })
        })
        .then(response => response.json())
        .then(data => {
            if (data.post) {
                loadPosts();
                newPostForm.reset();
            } else {
                alert(data.error || 'Failed to create post');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while creating the post.');
        });
    });

    // Publicar/Despublicar publicación
    window.togglePublish = function(postId, currentStatus) {
        fetch(`http://localhost:3000/admin/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ published: !currentStatus })
        })
        .then(response => response.json())
        .then(data => {
            if (data.updatedPost) {
                loadPosts();
            } else {
                alert(data.error || 'Failed to update post');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating the post.');
        });
    }

    // Eliminar publicación
    window.deletePost = function(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        fetch(`http://localhost:3000/admin/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                loadPosts();
            } else {
                alert(data.error || 'Failed to delete post');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the post.');
        });
    }

    // Logout
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
});
