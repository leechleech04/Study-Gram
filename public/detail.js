const modal = document.querySelector('.gray-bg');
document.querySelector('.delete-btn').addEventListener('click', () => {
  if (modal.style.display == 'none') {
    modal.style.display = 'flex';
  } else {
    modal.style.display = 'none';
  }
});
document.querySelector('.delete-no').addEventListener('click', () => {
  modal.style.display = 'none';
});

document.querySelector('.delete-yes').addEventListener('click', () => {
  fetch('/delete/<%= post._id %>', {
    method: 'DELETE',
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        return response.json();
      }
    })
    .catch((error) => console.error('Error:', error));
});

const comment_btn = document.querySelector('.comment-box button');
if ('<%= username %>') {
  comment_btn.disabled = false;
  comment_btn.style.backgroundColor = '#74c0fc';
  comment_btn.style.cursor = 'pointer';
} else {
  comment_btn.disabled = true;
  comment_btn.style.backgroundColor = '#808080';
  comment_btn.style.cursor = 'default';
}

const textarea = document.querySelector('textarea');
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
});

document.querySelectorAll('.put-comment').forEach((btn) => {
  btn.addEventListener('click', function (e) {
    e.target.parentElement.parentElement.nextElementSibling.style.display =
      'block';
    Array.from(e.target.parentElement.parentElement.children).forEach(
      (node) => {
        node.remove();
      }
    );
  });
});

document.querySelectorAll('.delete-comment').forEach((btn) => {
  btn.addEventListener('click', function (e) {
    for (let sibling of e.target.parentElement.parentElement.children) {
      if (sibling.classList.contains('comment-gray-bg')) {
        sibling.style.display = 'flex';
      }
    }
  });
});
document.querySelectorAll('.comment-delete-no').forEach((btn) => {
  btn.addEventListener('click', function (e) {
    e.target.parentElement.style.display = 'none';
  });
});
document.querySelectorAll('.comment-delete-yes').forEach((btn) => {
  btn.addEventListener('click', function (e) {
    fetch(
      `/delete-comment/${e.target.parentElement.parentElement.dataset.id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          e.target.parentElement.parentElement.remove();
        }
      })
      .catch((err) => console.error(err));
  });
});
