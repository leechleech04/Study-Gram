const modal = document.querySelector('.gray-bg');
if (document.querySelector('.delete-btn')) {
  document.querySelector('.delete-btn').addEventListener('click', () => {
    if (modal.style.display == 'none') {
      modal.style.display = 'flex';
    } else {
      modal.style.display = 'none';
    }
  });
}

if (document.querySelector('.delete-yes')) {
  document.querySelector('.delete-no').addEventListener('click', () => {
    modal.style.display = 'none';
  });
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
      `/delete-comment/${e.target.parentElement.parentElement.dataset.comment_id}`,
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
