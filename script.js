
const base = "http://localhost:3000"; // always talk to backend

// toggle UI
const container = document.querySelector(".container");
document.addEventListener("click", (e) => {
  if (e.target.matches(".SignUpLink")) {
    e.preventDefault();
    container.classList.add("active");
  }
  if (e.target.matches(".SignInLink")) {
    e.preventDefault();
    container.classList.remove("active");
  }
});

// register
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;

  try {
    const res = await fetch(`${base}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok) container.classList.remove("active");
  } catch {
    alert("⚠️ Registration failed");
  }
});

// login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${base}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
  localStorage.setItem("token", data.token);
  // redirect to your actual site (protected)

  window.location.href = "./index1.html";
 // change this to your site’s page
}
    else {
      alert(data.message);
    }
  } catch {
    alert("⚠️ Login failed");
  }
});
