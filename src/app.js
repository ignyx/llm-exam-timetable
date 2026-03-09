// Main application logic

document.addEventListener("DOMContentLoaded", function() {
    // Update loading status
    const statusElement = document.getElementById("status");
    console.assert(statusElement, "Status element not found in the DOM");
    statusElement.textContent = "Loaded! Ready to schedule exams.";
    statusElement.style.color = "#28a745";

    console.log("App loading complete");
});
