let sqli_enable = document.getElementById("SQLI_check");
let csrf_enable = document.getElementById("CSRF_check");

sqli_enable.checked = localStorage.getItem("sqli_enable");
csrf_enable.checked = localStorage.getItem("csrf_enable");

const formCSRF = document.getElementById("CSRF_form");
if (formCSRF)
    formCSRF.setAttribute("action", `/login?secure=${!csrf_enable.checked}`)

document.getElementById("SQLI")
    .addEventListener('click', (e) => {
        if (e.target.tagName !== "INPUT")
            sqli_enable.checked = !sqli_enable.checked;
        localStorage.setItem("sqli_enable", sqli_enable.checked);
    })

document.getElementById("CSRF")
    .addEventListener('click', (e) => {
        if (e.target.tagName !== "INPUT")
            csrf_enable.checked = !csrf_enable.checked;
        if (formCSRF)
            formCSRF.setAttribute("action", `/login?secure=${!csrf_enable.checked}`)
        localStorage.setItem("csrf_enable", csrf_enable.checked);
    })

document.getElementById("SQLI_search")
    .addEventListener('click', (e) => {
        let text = document.getElementById("SQLI_text").value;
        if (sqli_enable.checked === false) {
            text = text.trim();
            if (!text.match(/^[a-zA-Z ]*$/)) {
                appendError('SQLI_err');
                return;
            }
            text = encodeURIComponent(text);
            location.href = `/?search=${text}&sqli_security=true`
        } else {
            location.href = `/?search=${text}&sqli_security=false`
        }
    })

function appendError(element="") {
    const errP = document.getElementById(element);
    errP.innerHTML = '';
    let errSpan = document.createElement('span');
    errSpan.innerText = "Nedozvoljeni unos!";
    errP.appendChild(errSpan);
}