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
        },
        dataSource = new kendo.data.DataSource({
            pageSize: 50
        }),
        masterDetailViewModel = kendo.observable({
            dataSource: dataSource,
            _dataSourceOptions: dataSourceOptions,
            _jsdoOptions: jsdoOptions,
            itemClick: function(e) {

                app.mobileApp.navigate('#components/masterDetailView/details.html?uid=' + e.dataItem.uid);

            },
            detailsShow: function(e) {
                var item = e.view.params.uid,
                    dataSource = masterDetailViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.StateName) {
                    itemModel.StateName = String.fromCharCode(160);
                }

                masterDetailViewModel.set('currentItem', null);
                masterDetailViewModel.set('currentItem', itemModel);
            },
            currentItem: null
        });

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('masterDetailViewModel', masterDetailViewModel);
        });
    } else {
        parent.set('masterDetailViewModel', masterDetailViewModel);
    }

    parent.set('onShow', function(e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null;

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