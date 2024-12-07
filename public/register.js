const duplication = document.querySelector('.duplication');
const submitBtn = document.querySelector('.btn-box button');
duplication.addEventListener('click', () => {
  let id = document.querySelector('.id-box input').value;
  fetch(`/checkDuplication/${id}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.valid) {
        document.querySelector('.duplication-yes').style.display = 'none';
        document.querySelector('.duplication-no').style.display = 'block';
        submitBtn.style.backgroundColor = '#74c0fc';
        submitBtn.style.cursor = 'pointer';
        submitBtn.disabled = false;
      } else {
        document.querySelector('.duplication-yes').style.display = 'block';
        document.querySelector('.duplication-no').style.display = 'none';
        submitBtn.style.backgroundColor = '#808080';
        submitBtn.style.cursor = 'default';
        submitBtn.disabled = true;
      }
    });
});

const secondPw = document.querySelector('.second-pw');
secondPw.addEventListener('input', () => {
  let pw = document.querySelector('.first-pw').value;
  let secPw = secondPw.value;
  if (pw === secPw) {
    document.querySelector('.pw-not-matched').style.display = 'none';
    submitBtn.style.backgroundColor = '#74c0fc';
    submitBtn.style.cursor = 'pointer';
    submitBtn.disabled = false;
  } else {
    document.querySelector('.pw-not-matched').style.display = 'block';
    submitBtn.style.backgroundColor = '#808080';
    submitBtn.style.cursor = 'default';
    submitBtn.disabled = true;
  }
});
