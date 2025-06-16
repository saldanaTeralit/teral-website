document.getElementById("reseña-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const calificacion = document.getElementById("calificacion").value;
    const tema = document.getElementById("tema").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const imagenInput = document.getElementById("imagen").files[0];

    if (!nombre || !calificacion || !tema || !descripcion) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const nuevaReseña = document.createElement("div");
    nuevaReseña.classList.add("reseña-item");
    nuevaReseña.innerHTML = `
        <p><strong>${nombre}</strong> - ${calificacion}</p>
        <p><em>${tema}</em></p>
        <p>${descripcion}</p>
    `;

    if (imagenInput) {
        const imagenURL = URL.createObjectURL(imagenInput);
        nuevaReseña.innerHTML += `<img src="${imagenURL}" alt="Evidencia" class="reseña-img">`;
    }

    document.getElementById("reseñas-container").appendChild(nuevaReseña);
    document.getElementById("reseña-form").reset();
});
function guardarResena() {
  const nombre = document.getElementById("nombre").value.trim();
  const comentario = document.getElementById("comentario").value.trim();

  if (!nombre || !comentario) {
    alert("Completa ambos campos");
    return;
  }

  db.collection("resenas").add({
    nombre,
    comentario,
    fecha: new Date()
  }).then(() => {
    document.getElementById("nombre").value = "";
    document.getElementById("comentario").value = "";
    mostrarResenas();
  });
}

function mostrarResenas() {
  const contenedor = document.getElementById("reseñas");
  contenedor.innerHTML = "";

  db.collection("resenas").orderBy("fecha", "desc").get().then(query => {
    query.forEach(doc => {
      const r = doc.data();
      const div = document.createElement("div");
      div.innerHTML = `<p><strong>${r.nombre}:</strong> ${r.comentario}</p><hr>`;
      contenedor.appendChild(div);
    });
  });
}

window.onload = mostrarResenas;
// Función para desplazamiento suave en el menú
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll("nav ul li a").forEach(anchor => {
        anchor.addEventListener("click", function(event) {
            event.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});