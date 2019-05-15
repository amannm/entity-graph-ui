const E = React.createElement;


class ApplicationContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedRecord: null,
            currentResults: null
        };
        this.handleRecordSelect = this.handleRecordSelect.bind(this);
        this.handleResultsUpdate = this.handleResultsUpdate.bind(this);
    }

    handleRecordSelect(record) {
        this.setState({
            selectedRecord: record
        });
    }
    handleResultsUpdate(results) {
        this.setState({
            currentResults: results
        });
    }

    render() {

        return E("div", {className: "ApplicationContainer"},
            E(QueryContainer, {
                selectedRecord: this.state.selectedRecord,
                handleRecordSelect: this.handleRecordSelect,
                handleResultsUpdate: this.handleResultsUpdate
            }),
            E(EditorContainer, {
                selectedRecord: this.state.selectedRecord,
                currentResults: this.state.currentResults
            })
        );
    }
}

class EditorContainer extends React.Component {
    render() {
        const entityTypeMap = EntityManager.getTypes();
        const items = Object.keys(entityTypeMap).map(entityTypeId => E(WorkspaceEditor, {
            key: entityTypeId,
            entityType: entityTypeMap[entityTypeId],
            selectedRecord: this.props.selectedRecord,
            currentResults: this.props.currentResults
        }));
        return E("div", {
            className: "EditorContainer"
        }, items)
    }
}

class QueryContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            queryString: EntityManager.getDefaultQueryString(),
            queryResult: null
        };
        this.handleQueryUpdate = this.handleQueryUpdate.bind(this);
        this.handleQuerySubmit = this.handleQuerySubmit.bind(this);
    }

    handleQueryUpdate(queryString) {
        this.setState({
            queryString: queryString
        }, null);
    }

    handleQuerySubmit() {
        EntityManager.queryGraph(this.state.queryString, (sparqlQueryResult) => {
            if (sparqlQueryResult !== null) {
                const headers = sparqlQueryResult.head.vars;
                const bindingMapper = (binding) => {
                    return headers.map((header) => {
                        if(binding.hasOwnProperty(header)) {
                            const item = binding[header];
                            switch (item.type) {
                                case "uri":
                                    return "<" + item.value + ">";
                                case "literal":
                                default:
                                    return item.value;
                            }
                        } else {
                            return null;
                        }
                    });
                };
                const records = sparqlQueryResult.results.bindings.map(bindingMapper);
                const queryResult = {
                    headers: headers,
                    records: records
                };
                this.setState({
                    queryResult: queryResult
                }, null);
                this.props.handleResultsUpdate(queryResult);
            }
        });
    }

    render() {
        return E("div", {className: "QueryContainer"},
            E(QueryResults, {
                queryResult: this.state.queryResult,
                selectedRecord: this.props.selectedRecord,
                handleRecordSelect: this.props.handleRecordSelect
            }),
            E(QueryEditor, {
                queryString: this.state.queryString,
                handleQueryUpdate: this.handleQueryUpdate,
                handleQuerySubmit: this.handleQuerySubmit
            })
        );
    }
}

class QueryEditor extends React.Component {
    render() {
        return E("div", {className: "QueryEditor"},
            E("textarea", {
                value: this.props.queryString,
                onChange: (event) => this.props.handleQueryUpdate(event.target.value)
            }),
            E("button", {type: "button", onClick: (event) => this.props.handleQuerySubmit()}, "Submit")
        );
    }
}

class QueryResults extends React.Component {
    renderTable() {
        if (this.props.queryResult !== null) {

            const headerRow = E("tr", null, this.props.queryResult.headers.map((header, cellIndex) => E("th", {key: cellIndex}, header)));
            const tableHeader = E("thead", null, headerRow);

            const recordRows = this.props.queryResult.records.map((record, rowIndex) => E("tr", {
                key: rowIndex,
                className: this.props.selectedRecord === record ? "selected" : "",
                onClick: (e) => {
                    this.props.handleRecordSelect(record);
                }
            }, record.map((value, cellIndex) => E("td", {key: cellIndex}, value))));
            const tableBody = E("tbody", null, recordRows);

            return E("table", null, tableHeader, tableBody);
        }
        return "No Results";
    }

    render() {
        return E("div", {className: "QueryResults"},
            this.renderTable()
        );
    }
}

class WorkspaceEditor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedEntityId: null,
            entities: [],
            lockedEntityIds: new Set()
        };
        EntityManager.getAll(props.entityType, (rawEntities) => {
            const entities = EntityManager.dedupe(rawEntities, props.entityType.idProperty);
            const selectedEntityId = entities.length > 0 ? entities[0][props.entityType.idProperty] : null;
            this.setState({
                selectedEntityId: selectedEntityId,
                entities: entities
            }, null);
        });
        this.handleEntitySelect = this.handleEntitySelect.bind(this);
        this.handleEntityCreate = this.handleEntityCreate.bind(this);
        this.handleEntityUpdate = this.handleEntityUpdate.bind(this);
        this.resetSelectedEntity = this.resetSelectedEntity.bind(this);
        this.deleteSelectedEntity = this.deleteSelectedEntity.bind(this);
        this.saveSelectedEntity = this.saveSelectedEntity.bind(this);
        this.handleTestReset = this.handleTestReset.bind(this);
    }

    handleTestReset() {
        this.setState({
            selectedEntityId: null,
            entities: [],
            lockedEntityIds: new Set()
        }, null);
        EntityManager.deleteAll(this.props.entityType, this.state.entities, () => {
            EntityManager.putAllTest(this.props.entityType, () => {
                EntityManager.getAll(this.props.entityType, (rawEntities) => {
                    const entities = EntityManager.dedupe(rawEntities, this.props.entityType.idProperty);
                    const selectedEntityId = entities.length > 0 ? entities[0][this.props.entityType.idProperty] : null;
                    this.setState({
                        selectedEntityId: selectedEntityId,
                        entities: entities
                    }, null);
                });
            });
        });
    }

    handleEntitySelect(entityId) {
        if (entityId !== this.state.selectedEntityId) {
            this.setState({
                selectedEntityId: entityId
            }, null);
        }
    }

    handleEntityCreate() {
        const entityType = this.props.entityType;

        const newId = EntityManager.generateId();
        const newEntity = {};
        newEntity[entityType.idProperty] = newId;
        Object.keys(entityType.properties).forEach(property => {
            const datatype = entityType.properties[property];
            switch (datatype) {
                case "text":
                case "string":
                    if (entityType.summaryProperties.includes(property)) {
                        newEntity[property] = "Unknown " + property;
                    } else {
                        newEntity[property] = 'unknown';
                    }
                    break;
                case "uri":
                    newEntity[property] = 'unknown';
                    break;
                case "integer":
                    newEntity[property] = 0;
                    break;
                case "timestamp":
                    newEntity[property] = (new Date()).toISOString();
                    break;
                default:
                    throw 'unknown datatype: ' + datatype;
            }
        });

        EntityManager.put(entityType, newEntity, () => {
            let indexToInsertAt = this.state.entities.length;
            if (this.state.selectedEntityId !== null) {
                indexToInsertAt = this.state.entities.findIndex(entity => this.state.selectedEntityId === entity[entityType.idProperty])
                if (indexToInsertAt < this.state.entities.length) {
                    indexToInsertAt++;
                }
            }
            const newEntities = this.state.entities.filter(() => true);
            newEntities.splice(indexToInsertAt, 0, newEntity);
            this.setState({
                selectedEntityId: newId,
                entities: newEntities
            }, null);
        });
    }

    handleEntityUpdate(newEntity) {
        const entityType = this.props.entityType;
        const entityId = newEntity[entityType.idProperty];
        if (this.state.lockedEntityIds.has(entityId)) {
            return;
        }
        const newEntities = this.state.entities.map(existingEntity => {
            if (existingEntity[entityType.idProperty] === entityId) {
                return newEntity;
            } else {
                return existingEntity;
            }
        });
        this.setState({
            entities: newEntities
        }, null);
    }

    deleteSelectedEntity() {
        if (this.state.selectedEntityId !== null) {
            const entityId = this.state.selectedEntityId;
            if (this.state.lockedEntityIds.has(entityId)) {
                return;
            }
            this.setState({
                lockedEntityIds: (new Set(this.state.lockedEntityIds)).add(entityId)
            }, null);
            const entityType = this.props.entityType;
            EntityManager.deleteById(entityType, entityId, () => {
                const currentEntities = this.state.entities;
                let indexToSelect = null;
                const newEntities = [];
                for (let i = 0; i < currentEntities.length; i++) {
                    const entity = currentEntities[i];
                    if (entity[entityType.idProperty] !== entityId) {
                        newEntities.push(entity);
                    } else {
                        if (currentEntities.length !== 1) {
                            if (i === 0) {
                                indexToSelect = i;
                            } else {
                                indexToSelect = i - 1;
                            }
                        }
                    }
                }
                let nextEntityId = null;
                if (indexToSelect !== null) {
                    nextEntityId = newEntities[indexToSelect][entityType.idProperty];
                }
                const newLockedEntityIds = new Set(this.state.lockedEntityIds);
                newLockedEntityIds.delete(entityId);
                this.setState({
                    selectedEntityId: nextEntityId,
                    entities: newEntities,
                    lockedEntityIds: newLockedEntityIds
                }, null);
            });
        }
    }

    resetSelectedEntity() {
        if (this.state.selectedEntityId !== null) {
            if (this.state.lockedEntityIds.has(this.state.selectedEntityId)) {
                return;
            }
            this.setState({
                lockedEntityIds: (new Set(this.state.lockedEntityIds)).add(this.state.selectedEntityId)
            }, null);

            const entityType = this.props.entityType;
            const entityId = this.state.selectedEntityId;
            EntityManager.getById(entityType, entityId, (newEntity) => {
                const newEntities = this.state.entities.map(existingEntity => {
                    if (existingEntity[entityType.idProperty] === entityId) {
                        return newEntity;
                    } else {
                        return existingEntity;
                    }
                }).filter(e => e !== null);
                const newLockedEntityIds = new Set(this.state.lockedEntityIds);
                newLockedEntityIds.delete(entityId);
                this.setState({
                    entities: newEntities,
                    lockedEntityIds: newLockedEntityIds
                }, null);
            });
            this.setState({
                selectedEntityId: null
            }, null);
        }
    }

    saveSelectedEntity() {
        if (this.state.selectedEntityId !== null) {
            if (this.state.lockedEntityIds.has(this.state.selectedEntityId)) {
                return;
            }
            this.setState({
                lockedEntityIds: (new Set(this.state.lockedEntityIds)).add(this.state.selectedEntityId)
            }, null);
            const entityType = this.props.entityType;
            const currentEntity = this.state.entities.find(entity => entity[entityType.idProperty] === this.state.selectedEntityId);
            EntityManager.put(entityType, currentEntity, () => {
                const newLockedEntityIds = new Set(this.state.lockedEntityIds);
                newLockedEntityIds.delete(this.state.selectedEntityId);
                this.setState({
                    lockedEntityIds: newLockedEntityIds
                }, null);
            });
        }
    }

    render() {

        const entityListControls = E("div", {className: "EntityListControls"},
            E("p", null, this.props.entityType.displayName),
            E("button", {type: "button", onClick: this.handleEntityCreate}, "Create"),
            E("button", {type: "button", onClick: this.deleteSelectedEntity}, "Delete"),
            E("button", {type: "button", onClick: this.handleTestReset}, "Reset")
        );

        const entityList = E(EntityList, {
            entityType: this.props.entityType,
            selectedEntityId: this.state.selectedEntityId,
            entities: this.state.entities,
            lockedEntityIds: this.state.lockedEntityIds,
            handleEntitySelect: this.handleEntitySelect,
            selectedRecord: this.props.selectedRecord,
            currentResults: this.props.currentResults
        });

        const entityEditor = E(EntityEditor, {
            entityType: this.props.entityType,
            selectedEntityId: this.state.selectedEntityId,
            entities: this.state.entities,
            lockedEntityIds: this.state.lockedEntityIds,
            handleEntityUpdate: this.handleEntityUpdate,
            resetSelectedEntity: this.resetSelectedEntity,
            saveSelectedEntity: this.saveSelectedEntity
        });

        return E("div", {className: "WorkspaceEditor"},
            entityEditor,
            entityList,
            entityListControls
        )
    }
}

class EntityList extends React.Component {
    render() {
        let items = null;
        if (this.props.entityType !== null) {
            const entityType = this.props.entityType;
            const idProperty = entityType.idProperty;
            const itemMapper = (entity) => {
                const entityId = entity[idProperty];
                const classNames = [];
                if (this.props.currentResults !== null) {
                    //TODO: this is imprecise and expensive
                    if(this.props.currentResults.records.some(record => record.filter(v => v !== null).some(recordValue => recordValue.includes(entityId)))) {
                        classNames.push("highlighted");
                    }
                }
                if (entityId === this.props.selectedEntityId) {
                    classNames.push("selected");
                }
                if (this.props.lockedEntityIds.has(entityId)) {
                    classNames.push("locked");
                }
                const clickHandler = (event) => {
                    this.props.handleEntitySelect(entityId)
                };
                return {
                    key: entityId,
                    className: classNames.join(" "),
                    onClick: clickHandler
                };
            };
            const childrenMapper = (entity) => {
                const summaryMapper = (summaryProperty) => entity[summaryProperty];
                return entityType.summaryProperties.map(summaryProperty => E("p", {key: summaryProperty}, summaryMapper(summaryProperty)));
            };
            items = this.props.entities.map(entity => E("li", itemMapper(entity), childrenMapper(entity)));
        }
        return E("ul", {className: "EntityList"}, items);
    }
}

class EntityEditor extends React.Component {
    render() {
        if (this.props.selectedEntityId !== null) {
            const entityType = this.props.entityType;
            const currentEntity = this.props.entities.find(entity => entity[entityType.idProperty] === this.props.selectedEntityId);
            return E("div", {className: "EntityEditor"},
                E("p", null, currentEntity[entityType.idProperty]),
                E(EntityProperties, {
                    entityType: entityType,
                    entity: currentEntity,
                    isLocked: this.props.lockedEntityIds.has(currentEntity[entityType.idProperty]),
                    handleEntityUpdate: this.props.handleEntityUpdate
                }),
                E("div", {className: "EntityEditorControls"},
                    E("button", {
                        onClick: (e) => {
                            this.props.resetSelectedEntity();
                        }
                    }, "Cancel"),
                    E("button", {
                        onClick: (e) => {
                            this.props.saveSelectedEntity()
                        }
                    }, "Save")
                )
            );
        }
        return null;
    }
}

class EntityProperties extends React.Component {

    constructor(props) {
        super(props);
        this.handlePropertyChange = this.handlePropertyChange.bind(this);
    }

    handlePropertyChange(property, value) {
        if (!this.props.isLocked) {
            const newEntity = Object.assign({}, this.props.entity);
            newEntity[property] = value;
            this.props.handleEntityUpdate(newEntity);
        }
    }

    render() {

        var entityType = this.props.entityType;
        var inputMapper = (property) => {
            const handler = (event) => {
                this.handlePropertyChange(property, event.target.value);
            };
            const datatype = entityType.properties[property];
            const currentValue = this.props.entity[property];
            switch (datatype) {
                case "text":
                    return E("textarea", {
                        value: currentValue,
                        onChange: handler
                    });
                case "string":
                case "uri":
                    return E("input", {
                        type: "text",
                        value: currentValue,
                        onChange: handler
                    });
                case "integer":
                    return E("input", {
                        type: "number",
                        value: currentValue,
                        onChange: handler
                    });
                case "timestamp":
                    return E("input", {
                        key: property,
                        type: "text",
                        value: currentValue,
                        onChange: handler
                    });
                default:
                    throw 'unknown datatype: ' + datatype;
            }
        };
        var inputs = Object.keys(entityType.properties).map(property => {
            return E("div", {key: property}, inputMapper(property), E("p", null, property));
        });
        return E("div", {className: "EntityProperties"}, inputs);
    }

}
