<%
var isEverlive = typeof(source) !== 'undefined' && source === 'everlive',
    isJsdo = typeof(source) !== 'undefined' && source === 'jsdo',
    isSitefinity =  typeof(source) !== 'undefined' && source === 'sitefinity';
%>(function (parent){
    var <% if (isEverlive || isJsdo || isSitefinity) { %> provider = app.data.<%= dataProvider %>,
        <% if(enableRegistration) { %>mode = 'signin',
        registerRedirect = '<%= registerRedirect %>',<% } %>
        signinRedirect = '<%= signinRedirect %>',<% if (enableRememberme) { %>
        rememberKey = '<%= dataProvider %>_authData_<%= name %>',<% } %>
        init = function (error) {
            if (error) {
                if (error.message) {
                    alert(error.message);
                }<% if(isSitefinity) { %>
                    try {
                        var err = JSON.parse(error.responseText);
                        if (err) {
                            if (err.error) {
                                if (err.error.innererror && err.error.innererror.message) {
                                    alert(err.error.innererror.message);
                                } else if (err.error.message) {
                                    alert(err.error.message);
                                }
                            }
                        }
                    } catch (e) {}
                <% } %>
                return false;
            }

            var activeView = <% if(enableRegistration) { %> mode === 'signin' ? '.signin-view' : '.signup-view'<% } else { %>'.signin-view'<% } %>;

            if (provider.setup && provider.setup.offlineStorage && !app.isOnline()) {
                $('.offline').show().siblings().hide();
            } else {
                $(activeView).show().siblings().hide();
            }
<% if (enableRememberme) { %>
            var rememberedData = localStorage ? JSON.parse(localStorage.getItem(rememberKey)) : app[rememberKey];
            if (rememberedData && rememberedData.email && rememberedData.password) {

                parent.<%= name %>.set('email', rememberedData.email);
                parent.<%= name %>.set('password', rememberedData.password);
                parent.<%= name %>.signin();
            }<% } %>
        },
        successHandler = function (data) {
            var redirect = <% if(enableRegistration) { %> mode === 'signin' ? signinRedirect : registerRedirect<% } else { %>signinRedirect<% } %>,
                model = parent.<%= name %> || {},
                logout = model.logout;

            if (logout) {
                model.set('logout', null);
            }
            if (data<% if (isEverlive) { %> && data.result<% } %>) {
                if (logout) {
                    <% if (isEverlive || isJsdo) { %>provider.Users.logout(init, init);<% } else if (isSitefinity) { %>provider.authentication.logout(init, init);<% } %>
                    return;
                }<% if (enableRememberme) { %>
                var rememberedData = {
                        email: model.email,
                        password: model.password
                    };
                if (model.rememberme && rememberedData.email && rememberedData.password) {
                    if (localStorage) {
                        localStorage.setItem(rememberKey, JSON.stringify(rememberedData));
                    } else {
                        app[rememberKey] = rememberedData;
                    }
                }<% } %>
                <% if (isEverlive) { %>app.user = data.result;
                <% } %>
                setTimeout(function () {
                    app.mobileApp.navigate('components/' + redirect + '/view.html');
                }, 0);
            } else {
                init();
            }
        }, <% } %>
        <%= name %> = kendo.observable({
            displayName: '',
            email: '',
            password: '',
            validateData: function (data) {
                if(!data.email) {
                    alert('Missing email');
                    return false;
                }

                if(!data.password) {
                    alert('Missing password');
                    return false;
                }

                return true;
            },
            signin: function () {<% if(isEverlive || isJsdo || isSitefinity) { %>
                var model = <%= name %>,
                    email = model.email.toLowerCase(),
                    password = model.password;

                if (!model.validateData(model)) {
                    return false;
                }
<% if(isSitefinity) { %>
provider.authentication.login(email,password, successHandler, init);
<% } else { %>                provider.Users.login(email, password, successHandler, init);<% } %><% } %>
            }<% if(enableRegistration) { %>,
            register: function () {<% if(isEverlive || isJsdo) { %>
                var model = <%= name %>,
                    email = model.email.toLowerCase(),
                    password = model.password,
                    displayName = model.displayName,
                    attrs = {
                        Email: email,
                        DisplayName: displayName
                    };

                if (!model.validateData(model)) {
                    return false;
                }

                provider.Users.register(email, password, attrs, successHandler, init);<% } else if (isSitefinity) { %>alert('Sitefinity data does not support registering new users!')<% } %>
            },
            toggleView: function () {
                mode = mode === 'signin' ? 'register' : 'signin';
                init();
            }<% } %>
        });

    parent.set('<%= name %>', <%= name %>);
    parent.set('afterShow', function (e) {
        if (e && e.view && e.view.params && e.view.params.logout) {<% if (enableRememberme) { %>
            if (localStorage) {
                localStorage.setItem(rememberKey, null);
            } else {
                app[rememberKey] = null;
            }<% } %>
            <%= name %>.set('logout', true);
        }<% if (isEverlive || isJsdo) { %>
        provider.Users.currentUser().then(successHandler, init); <% } else if (isSitefinity) { %>if (provider.authentication.getToken()) {
            successHandler();
        } else {
            init();
        }<% } %>
    });
})(app.<%= parent %>);

// START_CUSTOM_CODE_<%= name %>
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_<%= name %>
