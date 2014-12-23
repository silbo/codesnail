var socket = undefined;
var editor = undefined;
var editor_other = undefined;
var oldCode = undefined;
var eSock = null;
var onlineUsers = {};
var currentUser = {};
var selectedUser = "";

/* When DOM has been loaded */
window.onload = function () {
    socket = io.connect();

    socket.emit("subscribe", "coding");

    /* Aquire all the users */
    socket.on("users", function (users) {
        onlineUsers = users;
        /* When the online users div does not exist */
        if ($("#online-users") == null) return;
        /* Empty the online users div */
        $("#online-users").html("");
        /* Populate all the online users */
        for (var key in users) {
            $("#online-users").html($("#online-users").html() +
                '<div id="' + users[key].name.replace(/ /g, "") + '" class="user" onclick="javascript:getCode(\'' + users[key].email + '\')">' +
                '<a class="mugshot-link" href="#" title="show code">' +
                '<center><img class="mugshot" src="' + users[key].profile.mugshot + '" alt="mugshot" /></center>' +
                '<p>' + users[key].name + '</p><p>points: ' + users[key].profile.points + '</p></a></div>');
        }
    });

    /* Receive the requested users code */
    socket.on("receive-code", function (code) {
        editor_other.setValue(code);
        $("#code-message").slideDown("fast")
        setTimeout(function () {
            $("#code-message").slideUp("fast");
        }, 2000);
    });

    /* Receive the requested task */
    socket.on("receive-task", function (task) {
        $('#task').fadeOut("slow", function () {
            $("#task").html("<h3>" + task.name + "</h3>");
            $("#task").fadeIn("slow");
            editor.setValue(task.initial);
        });
    });

    /* Receive the requested task */
    socket.on("receive-task-verification", function (name, points) {
        /* When someone solved the task */
        if (name) {
            /* Animate the user win */
            var offset = $("#" + name.replace(/ /g, "")).offset();
            /* Animate the user points */
            $("#code-points").css({ top: offset.top, left: offset.left+24 });
            $("#code-points").html("<img src='/images/" + points + "_points_badge.png' alt='points'>");
            $("#code-points").toggle("bounce", { times: 1 }, "slow");
            $("#code-points").fadeOut("fast");
        }
    });

    /* Get the task */
    socket.emit("get-task");

    socket.emit("sendCurrentUser");
    socket.on("exclusiveInvite", function (data) {
        //timeout with a refusal
        /*var r=confirm("You are invited to compete exclusively :D by:"+data.email);
         //if(r){
         socket.emit("eInviteResponse",{accepted:r,email:data.email,newSockAdd:data.newSockAdd});
         /*}else{
         socket.emit("eInviteResponse",{accepted:r});
         }*/
        $("#incomingInvitation").dialog({
            title: "Want to compete?",
            open: function (eve, ui) {

                var htm = '<div style="width:200px;"><div style="float:left;margin-right:20px; "><center><img class="mugshot" src="' + onlineUsers[data.email].profile.mugshot + '" alt="mugshot" /></center></div><div style="margin-left:30px;margin-top: 5px;"><div class="eUsername">' + onlineUsers[data.email].name + '</div><div style="font-size: 0.75em;">points:' + onlineUsers[data.email].profile.points + '</div></div></div>';
                htm += "<div style='clear:left;'></div>";
                $(this).html(htm);
                notifySound();
            },
            buttons: {
                "Accept": function () {
                    socket.emit("eInviteResponse", {accepted: true, email: data.email, newSockAdd: data.newSockAdd});
                    selectedUser = data.email;
                    $(this).dialog("close");
                },
                "Cancel": function () {
                    socket.emit("eInviteResponse", {accepted: false, email: data.email, newSockAdd: data.newSockAdd});
                    $(this).dialog("close");
                }
            }
        });

    });

    socket.on("initiateECode", function (data) {
        initiateECode(data.on);
    });

    socket.on("rejectedECodeInvitation", function (data) {
        invitationRejected();
    });
    socket.on("currentUser", function (data) {
        currentUser = data.user;
        //window.console.log(data.user);
    });

    /* Execute in intervals */
    setInterval(function () {
        var code = editor.getValue();
        /* When the users code has changed */
        if (oldCode != code)
        /* Send it for verification and saving */
            socket.emit("verify-task", "coding", editor.getValue());
        oldCode = code;
    }, 1000);

    /* Execute in intervals */
    setInterval(function () {
        /* Send ping to keep connection alive */
        socket.emit("ping");
    }, 10000);

    /* ACE editor initialization */
    editor_other = ace.edit("code-message");
    //editor_other.setTheme("ace/theme/monokai");
    editor_other.session.setMode("ace/mode/html");
    editor_other.setOptions({ maxLines: 50, minLines: 12 });
    editor_other.setReadOnly(true);

    editor = ace.edit("code");
    //editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/html");
    editor.setOptions({ maxLines: 50, minLines: 12 });
    editor.setAutoScrollEditorIntoView(true);

    /* Load emmet for fast coding */
    ace.config.loadModule("ace/ext/emmet", function () {
        ace.require("ace/lib/net").loadScript("http://nightwing.github.io/emmet-core/emmet.js", function () {
            editor.setOption("enableEmmet", true);
        });

        editor.setOptions({
            enableSnippets: true,
            enableBasicAutocompletion: true
        });
    });

    /* Enable autocomplete */
    ace.config.loadModule("ace/ext/language_tools", function () {
        editor.setOptions({
            enableSnippets: true,
            enableBasicAutocompletion: true
        });
    });
}

/* Get a users code */
function getCode(userEmail) {
    socket.emit("get-code", "coding", userEmail);
}


function sendInvite(email) {
    //socket.emit("sendExclusiveInvite", {email:email});
}

function invitationRejected() {
    $("#oUser").html("invitation Rejected");
    setTimeout(function () {
        $(inviDailog).dialog("close");
    }, 2000);
}

var inviDailog = null;
function inviteToECode() {
    inviDailog = $("#inviteExclusive").dialog({
        title: "select a coder",
        open: function (eve, ui) {
            $("#oUser").html("");
            for (var user in onlineUsers) {
                //window.console.log(user);
                if (user != currentUser.email) {
                    var htm = '<div style="width:200px;"><div style="float:left;"><center><img class="mugshot" src="' + onlineUsers[user].profile.mugshot + '" alt="mugshot" /></center></div><div style="margin-left:20px;margin-top: 5px;"><div class="eUsername">' + onlineUsers[user].name + '</div><div style="font-size: 0.75em;">points:' + onlineUsers[user].profile.points + '</div></div></div>';
                    htm += "<div style='clear:left;'></div>"
                    $("#oUser").append("<li userdata='" + user + "'>" + htm + "</li>");
                }
            }

            $("#oUser").selectable({
                filter: "li",
                selecting: function (event, ui) { //for limiting to one user
                    //window.console.log("crap");
                    if ($(".ui-selected, .ui-selecting").length > 1) {
                        $(ui.selecting).removeClass("ui-selecting");
                    }
                },
                selected: function (eve, ui) {
                    selectedUser = $(ui.selected).attr("userdata");
                }
            });
        },
        buttons:[{
            id:"btnInvite",
            text: "Invite",
            click: function() {
                if(selectedUser.length>0){
                    socket.emit("sendExclusiveInvite", {email: selectedUser});
                    $("#btnInvite").fadeOut(function(){$("#oUser").html("Please wait...")});
                }else{
                    alert("Select a user first");
                }
            }
        },
            {
                id:"btnCancel",
                text: "Cancel",
                click: function() {
                    $(this).dialog("close");
                }
            }]
    });
}

function initiateECode(on) {
    $(inviDailog).dialog("close");
    editor.destroy();
    editor_other.destroy();
    $("#silverWraper").hide();
    $("#eCode").show();
    var p1 = ace.edit("player1");
    //p1.setTheme("ace/theme/monokai");
    p1.session.setMode("ace/mode/html");
    p1.setOptions({maxLines: 50, minLines: 12 });
    p1.setAutoScrollEditorIntoView(true);

    var p2 = ace.edit("player2");
    //p2.setTheme("ace/theme/monokai");
    p2.session.setMode("ace/mode/html");
    p2.setOptions({ maxLines: 50, minLines: 12 });
    p2.setAutoScrollEditorIntoView(true);
    p2.setReadOnly(true);

    // hell magic man, yyber hax, dont try it at home
    var opponent = onlineUsers[selectedUser];
    $("#online-users").html("");
    $("#online-users").append(
        '<div id="' + currentUser.name.replace(/ /g, "") + '" class="user" onclick="javascript:getCode(\'' + currentUser.email + '\')">' +
        '<a class="mugshot-link" href="#" title="show code">' +
        '<center><img class="mugshot" src="' + currentUser.profile.mugshot + '" alt="mugshot" /></center>' +
        '<p>' + currentUser.name + '</p><p>points: ' + currentUser.profile.points + '</p></a></div>');
    $("#online-users").append(
        '<div id="' + opponent.name.replace(/ /g, "") + '" class="user" onclick="javascript:getCode(\'' + opponent.email + '\')">' +
        '<a class="mugshot-link" href="#" title="show code">' +
        '<center><img class="mugshot" src="' + opponent.profile.mugshot + '" alt="mugshot" /></center>' +
        '<p>' + opponent.name + '</p><p>points: ' + opponent.profile.points + '</p></a></div>');

    var newAdd = window.location.protocol + "//" + window.location.host + "/" + on;
    ///window.console.log(newAdd);
    eSock = io.connect(newAdd); //all ecomunication on this sock now

    p1.on("change", function(obj) {
        eSock.emit("recieveClientCode",{ code:p1.getValue() });
    });

    p1.on("paste", function(str) {
        alert("Pasting is not Allowed, You will be punished for Plagarism...");
        punish();
    });

    /* Receive the requested task */
    eSock.on("receive-etask", function(task) {
        $('#eTask').fadeOut("slow", function() {
            $("#eTask").html("<h3>" + task.name + "</h3>");
            $("#eTask").fadeIn("slow");
            p1.setValue(task.initial);
        });
    });

    /* Receive the requested task */
    eSock.on("receive-etask-verification", function (name, points) {
        /* When someone solved the task */
        if (name) {
            /* Animate the user win */
            var offset = $("#" + name.replace(/ /g, "")).offset();
            /* Animate the userpoints */
            $("#code-points").css({ top: offset.top, left: offset.left+24 });
            $("#code-points").html("<img src='/images/" + points + "_points_badge.png' alt='points'>");
            $("#code-points").toggle("bounce", { times: 1 }, "slow");
            $("#code-points").fadeOut("fast");
        }
    });

    function punish() { //ignore this
        setTimeout(function () {
            p1.setValue("You are punished!! :D");
        }, 2000);
    }

    eSock.on("eCode-done", function(email) {
        alert(onlineUsers[email].name+" Won!");
        setTimeout(function () {
            window.location = "/coding";
        }, 3000);
    });

    eSock.on("p2Status", function (data) {
        p2.setValue(data.code);
    });

    /* Get the task */
    eSock.emit("get-etask");
}
