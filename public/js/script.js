(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

const toggleBtn = document.getElementById("themeToggle");
const body = document.body;

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");

    if (body.classList.contains("dark-mode")) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem("theme", "dark");
    } else {
      toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      localStorage.setItem("theme", "light");
    }
  });

  // Load saved theme on page load
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
}
