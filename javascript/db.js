var db = {};

function autoincrementId(db) {
    var ai = function() {
        this.id = db().max('id') + 1;
    };

    db.settings({
        onInsert : ai
    });
}

db.musics = TAFFY([ {
    id : 1,
    title : 'Demo1',
    size : 10
}, {
    id : 2,
    title : 'Demo2',
    size : 13
}, {
    id : 3,
    title : 'Demo3',
    size : 104
}, {
    id : 4,
    title : 'Demo4',
    size : 106
}, {
    id : 5,
    title : 'Demo5',
    size : 1043
} ]);

db.users = TAFFY([ {
    id : 1,
    name : 'mary'
}, {
    id : 2,
    name : 'john'
} ]);

autoincrementId(db.musics);
autoincrementId(db.users);
// ////////////////////////////////////

