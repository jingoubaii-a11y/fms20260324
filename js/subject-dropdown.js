var selectedSubjects = ['成都分公司', '北京分公司', '上海分公司', '广州分公司'];
var allSubjects = ['全部主体', '成都分公司', '北京分公司', '上海分公司', '广州分公司'];

function initSubjectDropdown() {
    var dropdownTrigger = document.querySelector('.subject-dropdown-trigger');
    var dropdownMenu = document.getElementById('subject-dropdown');

    dropdownTrigger.addEventListener('click', function(e) {
        if (e.target.classList.contains('subject-remove')) {
            return;
        }
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', function(e) {
        if (!dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    var checkboxes = document.querySelectorAll('.subject-checkbox');
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var value = this.getAttribute('data-value');
            if (this.checked) {
                if (value === '全部主体') {
                    selectedSubjects = ['全部主体'];
                    checkboxes.forEach(function(cb) {
                        if (cb.getAttribute('data-value') !== '全部主体') {
                            cb.checked = false;
                        }
                    });
                } else {
                    var allCheckbox = document.querySelector('.subject-checkbox[data-value="全部主体"]');
                    if (allCheckbox) {
                        allCheckbox.checked = false;
                    }
                    selectedSubjects = selectedSubjects.filter(function(s) {
                        return s !== '全部主体';
                    });
                    if (selectedSubjects.indexOf(value) === -1) {
                        selectedSubjects.push(value);
                    }
                }
            } else {
                selectedSubjects = selectedSubjects.filter(function(s) {
                    return s !== value;
                });
            }
            updateSelectedTags();
        });
    });

    var removeButtons = document.querySelectorAll('.subject-remove');
    removeButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var value = this.getAttribute('data-value');
            selectedSubjects = selectedSubjects.filter(function(s) {
                return s !== value;
            });
            var checkbox = document.querySelector('.subject-checkbox[data-value="' + value + '"]');
            if (checkbox) {
                checkbox.checked = false;
            }
            updateSelectedTags();
        });
    });

    updateSelectedTags();
}

function updateSelectedTags() {
    var container = document.getElementById('selected-subjects');
    container.innerHTML = '';

    selectedSubjects.forEach(function(subject) {
        var tag = document.createElement('span');
        tag.className = 'subject-tag px-2 py-1 rounded flex items-center space-x-1';

        var textSpan = document.createElement('span');
        textSpan.textContent = subject;

        var removeSpan = document.createElement('span');
        removeSpan.className = 'cursor-pointer hover:text-red-500 subject-remove';
        removeSpan.setAttribute('data-value', subject);
        removeSpan.textContent = '×';

        removeSpan.addEventListener('click', function(e) {
            e.stopPropagation();
            selectedSubjects = selectedSubjects.filter(function(s) {
                return s !== subject;
            });
            var checkbox = document.querySelector('.subject-checkbox[data-value="' + subject + '"]');
            if (checkbox) {
                checkbox.checked = false;
            }
            updateSelectedTags();
        });

        tag.appendChild(textSpan);
        tag.appendChild(removeSpan);
        container.appendChild(tag);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubjectDropdown);
} else {
    initSubjectDropdown();
}
