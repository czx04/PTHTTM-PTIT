class BaseView {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        if (!this.element) {
            console.warn(`Element with id '${elementId}' not found`);
        }
    }

    show() {
        if (this.element) {
            this.element.style.display = 'flex';
        }
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    getElementById(id) {
        return document.getElementById(id);
    }

    showAlert(elementId, message, type) {
        const alertDiv = this.getElementById(elementId);
        if (alertDiv) {
            alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            setTimeout(() => {
                alertDiv.innerHTML = '';
            }, 5000);
        }
    }
}
