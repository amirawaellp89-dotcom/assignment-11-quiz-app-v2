
// Get the elements from HTML
const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");

const categoryMenu = document.getElementById("categoryMenu");
const difficultyOptions = document.getElementById("difficultyOptions");

const questionsNumber = document.getElementById("questionsNumber");

// Add extra categories using JavaScript
const extraCategories = [
    { id: "27", name: "Animals", icon: "fa-paw" },
    { id: "19", name: "Mathematics", icon: "fa-calculator" },
    { id: "22", name: "Geography", icon: "fa-globe" },
    { id: "11", name: "Film", icon: "fa-film" },
    { id: "12", name: "Music", icon: "fa-music" },
    { id: "14", name: "Television", icon: "fa-tv" },
    { id: "15", name: "Video Games", icon: "fa-gamepad" }
];

// Add the new categories to the existing dropdown
const categoryOptions = categorySelect.querySelector(".custom-select-options");

extraCategories.forEach(function (category) {

    const option = document.createElement("div");

    option.className = "custom-select-option";
    option.dataset.value = category.id;

    option.innerHTML = `
        <i class="fa-solid ${category.icon}"></i>
        ${category.name}
    `;

    categoryOptions.appendChild(option);
});

// Function to control custom dropdowns
function setupDropdown(dropdown, hiddenInput) {

    const trigger = dropdown.querySelector(".custom-select-trigger");
    const options = dropdown.querySelectorAll(".custom-select-option");
    const selectedText = dropdown.querySelector(".custom-select-text");
    const selectedIcon = dropdown.querySelector(".custom-select-icon");
    // Open and close dropdown
    trigger.addEventListener("click", function () {

        dropdown.classList.toggle("open");

    });

    // Select an option
    options.forEach(function (option) {

        option.addEventListener("click", function () {

            const value = option.dataset.value;
            const text = option.textContent.trim();

            // Update selected text
            selectedText.textContent = text;

          // Update selected icon
        const optionIcon = option.querySelector("i");

        if (optionIcon) {
        selectedIcon.innerHTML = optionIcon.outerHTML;
                }
            // Update hidden input
            hiddenInput.value = value;

            // Update dropdown value
            dropdown.dataset.value = value;

            // Remove old selected class
            options.forEach(function (item) {
                item.classList.remove("selected");
            });

            // Add selected class
            option.classList.add("selected");

            // Close dropdown
            dropdown.classList.remove("open");

        });

    });

}

// Setup category dropdown
setupDropdown(categorySelect, categoryMenu);

// Setup difficulty dropdown
setupDropdown(difficultySelect, difficultyOptions);

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {

    if (!categorySelect.contains(event.target)) {
        categorySelect.classList.remove("open");
    }

    if (!difficultySelect.contains(event.target)) {
        difficultySelect.classList.remove("open");
    }

});

// Increase and decrease questions number
const numberButtons = document.querySelectorAll(".number-btn");

numberButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        let currentNumber = Number(questionsNumber.value);

        if (button.dataset.action === "increment") {

            if (currentNumber < 50) {
                questionsNumber.value = currentNumber + 1;
            }

        } else if (button.dataset.action === "decrement") {

            if (currentNumber > 1) {
                questionsNumber.value = currentNumber - 1;
            }

        }

    });

});
