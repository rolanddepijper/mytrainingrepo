'use strict';

app.masterDetailView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_masterDetailView
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_masterDetailView
(function(parent) {
    var dataProvider = app.data.progressDataProvider,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('masterDetailViewModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },
        processImage = function(img) {

            if (!img) {
                var empty1x1png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=';
                img = 'data:image/png;base64,' + empty1x1png;
            }

            return img;
        },
        jsdoOptions = {
            name: 'State',
            autoFill: false
        },
        dataSourceOptions = {
            type: 'jsdo',
            transport: {},
            error: function(e) {

                if (e.xhr) {
                    alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'StateName': {
                            field: 'StateName',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
            serverSorting: true,
            serverPaging: true,
            pageSize: 50
        },
        dataSource = new kendo.data.DataSource({
            pageSize: 50
        }),
        masterDetailViewModel = kendo.observable({
            dataSource: dataSource,
            _dataSourceOptions: dataSourceOptions,
            _jsdoOptions: jsdoOptions,
            searchChange: function(e) {
                var searchVal = e.target.value,
                    searchFilter;

                if (searchVal) {
                    searchFilter = {
                        field: 'State',
                        operator: 'contains',
                        value: searchVal
                    };
                }
                fetchFilteredData(masterDetailViewModel.get('paramFilter'), searchFilter);
            },
            fixHierarchicalData: function(data) {
                var result = {},
                    layout = {};

                $.extend(true, result, data);

                (function removeNulls(obj) {
                    var i, name,
                        names = Object.getOwnPropertyNames(obj);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];

                        if (obj[name] === null) {
                            delete obj[name];
                        } else if ($.type(obj[name]) === 'object') {
                            removeNulls(obj[name]);
                        }
                    }
                })(result);

                (function fix(source, layout) {
                    var i, j, name, srcObj, ltObj, type,
                        names = Object.getOwnPropertyNames(layout);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];
                        srcObj = source[name];
                        ltObj = layout[name];
                        type = $.type(srcObj);

                        if (type === 'undefined' || type === 'null') {
                            source[name] = ltObj;
                        } else {
                            if (srcObj.length > 0) {
                                for (j = 0; j < srcObj.length; j++) {
                                    fix(srcObj[j], ltObj[0]);
                                }
                            } else {
                                fix(srcObj, ltObj);
                            }
                        }
                    }
                })(result, layout);

                return result;
            },
            itemClick: function(e) {
                var dataItem = e.dataItem || masterDetailViewModel.originalItem;

                app.mobileApp.navigate('#components/masterDetailView/details.html?uid=' + dataItem.uid);

            },
            editClick: function() {
                var uid = this.originalItem.uid;
                app.mobileApp.navigate('#components/masterDetailView/edit.html?uid=' + uid);
            },
            detailsShow: function(e) {
                masterDetailViewModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = masterDetailViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.StateName) {
                    itemModel.StateName = String.fromCharCode(160);
                }

                masterDetailViewModel.set('originalItem', itemModel);
                masterDetailViewModel.set('currentItem',
                    masterDetailViewModel.fixHierarchicalData(itemModel));

                return itemModel;
            },
            linkBind: function(linkString) {
                var linkChunks = linkString.split('|');
                if (linkChunks[0].length === 0) {
                    return this.get("currentItem." + linkChunks[1]);
                }
                return linkChunks[0] + this.get("currentItem." + linkChunks[1]);
            },
            imageBind: function(imageField) {
                if (imageField.indexOf("|") > -1) {
                    return processImage(this.get("currentItem." + imageField.split("|")[0]));
                }
                return processImage(imageField);
            },
            currentItem: {}
        });

    parent.set('editItemViewModel', kendo.observable({
        editFormData: {},
        onShow: function(e) {
            var itemUid = e.view.params.uid,
                dataSource = masterDetailViewModel.get('dataSource'),
                itemData = dataSource.getByUid(itemUid),
                fixedData = masterDetailViewModel.fixHierarchicalData(itemData);

            this.set('itemData', itemData);
            this.set('editFormData', {
                textField: itemData.StateName,
            });
        },
        linkBind: function(linkString) {
            var linkChunks = linkString.split(':');
            return linkChunks[0] + ':' + this.get("itemData." + linkChunks[1]);
        },
        onSaveClick: function(e) {
            var editFormData = this.get('editFormData'),
                itemData = this.get('itemData'),
                dataSource = masterDetailViewModel.get('dataSource');

            // prepare edit
            itemData.set('StateName', editFormData.textField);

            dataSource.one('sync', function(e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.one('error', function() {
                dataSource.cancelChanges(itemData);
            });

            dataSource.sync();
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('masterDetailViewModel', masterDetailViewModel);
        });
    } else {
        parent.set('masterDetailViewModel', masterDetailViewModel);
    }

    parent.set('onShow', function(e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
            isListmenu = false,
            backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper');

        if (param || isListmenu) {
            backbutton.show();
            backbutton.css('visibility', 'visible');
        } else {
            if (e.view.element.find('header [data-role="navbar"] [data-role="button"]').length) {
                backbutton.hide();
            } else {
                backbutton.css('visibility', 'hidden');
            }
        }

        dataProvider.loadCatalogs().then(function _catalogsLoaded() {
            var jsdoOptions = masterDetailViewModel.get('_jsdoOptions'),
                jsdo = new progress.data.JSDO(jsdoOptions),
                dataSourceOptions = masterDetailViewModel.get('_dataSourceOptions'),
                dataSource;

            dataSourceOptions.transport.jsdo = jsdo;
            dataSource = new kendo.data.DataSource(dataSourceOptions);
            masterDetailViewModel.set('dataSource', dataSource);

            fetchFilteredData(param);
        });
    });

})(app.masterDetailView);

// START_CUSTOM_CODE_masterDetailViewModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

var dataSourceOptions = app.masterDetailView.masterDetailViewModel.get('_dataSourceOptions');
dataSourceOptions.serverFiltering = true;
dataSourceOptions.serverSorting = true;
dataSourceOptions.serverPaging = true;
dataSourceOptions.pageSize = 50;
dataSourceOptions.transport = {
    countFnName: "count"
};

app.masterDetailView.masterDetailViewModel.get('_jsdoOptions').events = {
    'afterSaveChanges': [{
        scope: app.masterDetailView.masterDetailViewModel,
        fn: function(jsdo, success, request) {
            //afterSaveChanges event handler statements ...
            alert(request);
            alert(request.batch);
            var response = request.batch.operations[0].response;
            var error = "",
                i;
            if (!request.success && response) {
                try 
                {
                    if (response._retVal) // HTTP500 - Return error
                    {
                        error += "\n" + response._retVal;
                    } 
                    else if (response._errors instanceof Array &&
                        response._errors.length > 0) // AppError
                    {
                        error += "\n" + response._errors[0]._errorMsg;
                    } 
                    else if (response.dsState["prods:errors"] &&
                        response.dsState["prods:errors"].ttState instanceof Array) // temp-table errors
                    {
                        for (i = 0; i < response.dsState["prods:errors"].ttState.length; i += 1) 
                        {
                            error += "\n" + response.dsState["prods:errors"].ttState[i]["prods:error"];
                        }
                    }
                } catch (response) {
                    alert("Error while parsing response: " + response);
                }
                alert("Error returned from server: " + error);
                var errorstring = document.getElementById('errorstring');
                errorstring.style.backgroundColor = "red";
                errorstring.innerHTML = error;

            }
        }
    }]
};
// you can handle the beforeFill / afterFill events here. For example:
/*
app.masterDetailView.masterDetailViewModel.get('_jsdoOptions').events = {
    'beforeFill' : [ {
        scope : app.masterDetailView.masterDetailViewModel,
        fn : function (jsdo, success, request) {
            // beforeFill event handler statements ...
        }
    } ]
};
*/
// END_CUSTOM_CODE_masterDetailViewModel