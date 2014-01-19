var socket = undefined;
var editor = undefined;
var editor_other = undefined;
var oldCode = undefined;
var eSock = null;
var onlineUsers = {};
var currentUser = {};


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
                '<img class="mugshot" src="' + users[key].profile.mugshot + '" alt="mugshot" />' +
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
            $("#task").html("<p>" + task.name + "</p>");
            $("#task").fadeIn("slow");
        });
    });

    /* Receive the requested task */
    socket.on("receive-task-verification", function (name, points) {
        /* When someone solved the task */
        if (name) {
            /* Animate the user win */
            var offset = $("#" + name.replace(/ /g, "")).offset();
            $("#code-win").css({ top: offset.top + 15, left: offset.left - 10 });
            $("#code-win").fadeIn("fast");
            setTimeout(function () {
                $("#code-win").fadeOut("fast");
            }, 2000);
            /* Animate the use points */
            $("#code-points").css({ top: offset.top, left: offset.left });
            $("#code-points").html(points);
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
                var htm = '<div style="width:200px;"><div style="float:left;margin-right:20px; "><img class="mugshot" src="' + onlineUsers[data.email].profile.mugshot + '" alt="mugshot" /></div><div style="margin-left:30px;margin-top: 5px;"><div class="eUsername">' + onlineUsers[data.email].name + '</div><div style="font-size: 0.75em;">points:' + onlineUsers[data.email].profile.points + '</div></div></div>';
                htm += "<div style='clear:left;'></div>";
                $(this).html(htm);
            },
            buttons: {
                "Accept": function () {
                    socket.emit("eInviteResponse", {accepted: true, email: data.email, newSockAdd: data.newSockAdd});
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
    editor_other.session.setMode("ace/mode/html");
    editor_other.setOptions({ maxLines: 10, minLines: 10 });

    editor = ace.edit("code");
    editor.session.setMode("ace/mode/html");
    editor.setOptions({ maxLines: 10, minLines: 10 });
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
    var selectedUser = "";
    inviDailog = $("#inviteExclusive").dialog({
        title: "select a coder",
        open: function (eve, ui) {
            $("#oUser").html("");
            for (var user in onlineUsers) {
                //window.console.log(user);
                if (user != currentUser.email) {
                    var htm = '<div style="width:200px;"><div style="float:left;"><img class="mugshot" src="' + onlineUsers[user].profile.mugshot + '" alt="mugshot" /></div><div style="margin-left:20px;margin-top: 5px;"><div class="eUsername">' + onlineUsers[user].name + '</div><div style="font-size: 0.75em;">points:' + onlineUsers[user].profile.points + '</div></div></div>';
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
        buttons: {
            "Invite": function () {
                /*var tmepUser={
                 email:selectedUser,
                 name:onlineUsers[selectedUser].name,
                 }*/
                if(selectedUser.length>0){
                    socket.emit("sendExclusiveInvite", {email: selectedUser});
                    $("#oUser").html("Please wait...");
                }else{
                    alert("Select a user first");
                }
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });
}

function initiateECode(on) {
    $(inviDailog).dialog("close");
    editor.destroy();
    editor_other.destroy();
    $("#silverWraper").hide();
    $("#eCode").show();
    var p1 = ace.edit("player1");
    p1.session.setMode("ace/mode/html");
    p1.setOptions({maxLines: 10, minLines: 15});
    p1.setAutoScrollEditorIntoView(true);

    var p2 = ace.edit("player2");
    p2.session.setMode("ace/mode/html");
    p2.setOptions({ maxLines: 10, minLines: 15 });
    p2.setAutoScrollEditorIntoView(true);
    p2.setReadOnly(true);

    var newAdd = window.location.protocol + "//" + window.location.host + "/" + on;
    ///window.console.log(newAdd);
    eSock = io.connect(newAdd); //all ecomunication on this sock now

    p1.on("change", function(obj){
        eSock.emit("recieveClientCode",{code:p1.getValue()});
    });

    p1.on("paste", function(str){
        alert("Pasting is not Allowed, You will be punished for Plagarism...");
        punish();
    });

    function punish(){ //ignore this
        setTimeout(function () {
            p1.setValue("You are punished!! :D");
        }, 2000);
    }


    eSock.on("p2Status", function (data) {
        p2.setValue(data.code);
    });


}