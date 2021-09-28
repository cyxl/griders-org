function toggleHide(ele) {
    if (ele.classList.contains('inv'))
        ele.classList.remove('inv');
    else
        ele.classList.add('inv');
}

//init
let allPermissions = {
    // General
    'General': {
        'Create Instant Invite': 0x1,
        'Kick Members': 0x2,
        'Ban Members': 0x4,
        'Administrator': 0x8,
        'Manage Channels': 0x10,
        'Manage Server': 0x20,
        'Change Nickname': 0x4000000,
        'View Server Insights': 0x80000,
        'Manage Nicknames': 0x8000000,
        'Manage Roles': 0x10000000,
        'Manage Webhooks': 0x20000000,
        'Manage Emojis': 0x40000000,
        'View Audit Log': 0x80
    },
    // Text
    'Text': {
        'Add Reactions': 0x40,
        'Read Messages/View Channel': 0x400,
        'Send Messages': 0x800,
        'Send TTS Messages': 0x1000,
        'Manage Messages': 0x2000,
        'Embed Links': 0x4000,
        'Attach Files': 0x8000,
        'Read Message History': 0x10000,
        'Mention @everyone, @here, and All Roles': 0x20000,
        'Use External Emojis': 0x40000,
        'Use Slash Commands': 0x80000000
    },
    // Voice
    'Voice': {
        'Connect': 0x100000,
        'Speak': 0x200000,
        'Video': 0x200,
        'Mute Members': 0x400000,
        'Deafen Members': 0x800000,
        'Move Members': 0x1000000,
        'Use Voice Activity': 0x2000000,
        'Priority Speaker': 0x100,
        'Request to Speak': 0x100000000
    }
};

let permissionList = document.getElementById('permission-list');
for (let category in allPermissions) {
    let parentCategory = document.createElement('div');
    parentCategory.className = 'category';
    parentCategory.innerHTML = `<h2 class="title">${category}</h2>`;
    for (let permission in allPermissions[category]) {
        parentCategory.innerHTML += `<label class="container">
                                        <input class="checkbox" type="checkbox" onchange="calcValue(${allPermissions[category][permission]})"/>
                                        <div class="custom"></div>${permission}
                                    </label>`;
    }
    permissionList.appendChild(parentCategory);
}


let permissionsLog = document.getElementById('final-number');
let botPermissionsValue = 0;

function calcValue(value) {
    botPermissionsValue += botPermissionsValue & value ? -value : value;
    permissionsLog.innerHTML = '&permissions=' + botPermissionsValue;
}

function selectAll() {
    for (let item of document.querySelectorAll('#permission-list input[type=checkbox]')) {
        item.checked = true;
    }

    let total = 0;
    for (let category in allPermissions) {
        for (let permission in allPermissions[category]) {
            total += allPermissions[category][permission];
        }
    }

    botPermissionsValue = total;
    permissionsLog.innerHTML = '&permissions=' + botPermissionsValue;
}

let verboseLog = document.getElementById('verbose-final-number');
let verboseLevel = 0;

function verboseCalc(n) {
    verboseLevel ^= n;
    verboseLog.innerHTML = `verbose=${verboseLevel}`;
}

let allLists = {
    'permissions': [],
    'fixed': [],
    'username': [],
    'pfp': [],
    'contents': [],
    'ban-whitelist': []
}

function acceptInput(ID, listName) {
    let input = document.getElementById(ID);
    if (input.value.length == 0) {
        allLists[ID].push(null)
        input.value = `<i class="special-character">null</i>`;
    } else {
        let buffer = input.value;

        function checkCode(str, index) {
            switch (str[index + 1]) {
                case 'b':
                    return ['\b', 2];
                case 't':
                    return ['\t', 2];
                case 'n':
                    return ['\n', 2];
                case 'f':
                    return ['\f', 2];
                case 'r':
                    return ['\r', 2];
                case 'u':
                    if (str.length >= index + 6) {
                        for (let i = 2; i < 6; i++) {
                            let code = str[index + i].charCodeAt();
                            if (!((code >= 48 && code <= 57) || (code >= 65 && code <= 70))) {
                                return [-1, -1]
                            }
                        }
                        return [str.substr(index + 2, index + 4), 6]
                    }
                default:
                    return [-1, -1];
            }
        }

        let coloringPlaces = [];

        for (let i = 0, offset_2 = 0, offset_6 = 0; i < buffer.length - 1; i++) {
            if (buffer[i] == '\\') {
                let [a, b] = checkCode(buffer, i);
                if (b == 2) {
                    buffer = buffer.substr(0, i) + a + buffer.substr(i + 2);
                    coloringPlaces.push(i + offset_2 + offset_6 * 5, b);
                    offset_2++;
                } else if (b == 6) {
                    buffer = buffer.substr(0, i) + String.fromCharCode('0x' + a) + buffer.substr(i + 6);
                    coloringPlaces.push(i + offset_2 + offset_6 * 5, b);
                    offset_6++;
                }
            }
        }

        allLists[ID].push(buffer);
        buffer = [];
        // XSS is really buggy to the lists so just put a simple patch to it will increase the user experience
        for (let i = 0, place = coloringPlaces.shift(), str = input.value[i]; i < input.value.length; i++, str = input.value[i])
            if (i == place) {
                buffer.push('<i class="special-character">');
                let endpoint = coloringPlaces.shift()
                for (let j = 0; j < endpoint; j++, i++, str = input.value[i]) {
                    buffer.push(str);
                }
                buffer.push('</i>');
                place = coloringPlaces.shift();
                i--;
            } else if (str == '<' || str == '>' || str == '\\' || str == '"' || str == "'" || str == '/' || str == '=')
                buffer.push(`&#${str.charCodeAt()};`)
            else
                buffer.push(str);

        input.value = buffer.join('');
    }
    let list = document.getElementById(listName);
    list.innerHTML += `<li onclick="discardItem(this, '${ID}', ${allLists[ID].length - 1})">${input.value}</li>`;
    input.value = '';
}

function discardItem(element, ID, index) {
    let list = element.parentElement.children
    element.remove();
    allLists[ID].splice(index, 1);
    for (let i = index; i < allLists[ID].length; i++) {
        list[i].setAttribute('onclick', `discardItem(this, '${ID}', ${i})`);
    }
}

function checkEnter(ID, listName) {
    if (event.keyCode == 13) acceptInput(ID, listName)
}

function saveAll() {
    let config = {
        token: document.getElementById('token').value,
        permissions: allLists['permissions'],
        bomb_messages: {
            random: document.getElementById('random').value,
            fixed: allLists['fixed']
        },
        webhook_spam: {
            usernames: allLists['username'],
            pfp_urls: allLists['pfp'],
            contents: allLists['contents'],
            bot_permission: botPermissionsValue.toString()
        },
        command_prefix: document.getElementById('commandPrefix').value,
        bot_status: document.querySelector('input[name="status"]:checked').id.replace('status-', ''),
        verbose: verboseLevel,
        after: document.getElementById('after-commands').value.split('\n'),
        proxies: [],
        ban_whitelist: allLists['ban-whitelist']
    }

    downloadFile(
        JSON.stringify(config, null, 4), // indent with 4 spaces
        'default.json'
    )
}

function downloadFile(data, fileName, type = "text/plain") {
    // Create an invisible A element
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);

    // Set the HREF to a Blob representation of the data to be downloaded
    a.href = window.URL.createObjectURL(
        new Blob([data], {type})
    );

    // Use download attribute to set set desired file name
    a.setAttribute("download", fileName);

    // Trigger the download by simulating click
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
}