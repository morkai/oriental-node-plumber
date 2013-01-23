var format = require('util').format;
var _ = require('lodash');
var step = require('two-step');
var orientdb = require('orientdb');

var serverConfig = {
  host: '127.0.0.1',
  port: 2424
};

var dbConfig = {
  name: 'plumber',
  user_name: 'admin',
  user_password: 'admin'
};

var schema = {
  Element: {
    extends: 'OGraphVertex',
    name: {
      type: 'string',
      mandatory: true,
      notNull: true,
      min: 1,
      max: 200
    },
    type: {
      type: 'string',
      mandatory: true,
      notNull: true,
      min: 1,
      max: 50
    },
    top: {
      type: 'short',
      mandatory: true,
      notNull: true
    },
    left: {
      type: 'short',
      mandatory: true,
      notNull: true
    }
  },
  Connection: {
    extends: 'OGraphEdge',
    type: {
      type: 'string',
      mandatory: true,
      notNull: true,
      min: 1,
      max: 50
    },
    source: {
      type: 'string',
      mandatory: true,
      notNull: true,
      min: 1,
      max: 50
    },
    target: {
      type: 'string',
      mandatory: true,
      notNull: true,
      min: 1,
      max: 50
    }
  }
};

var db = new orientdb.GraphDb(
  dbConfig.name,
  new orientdb.Server(serverConfig),
  dbConfig
);

app.db = db;

db.open(function(err)
{
  if (err)
  {
    console.error("Failed to connect to the database: %s", err.message || err);
    process.exit(1);
  }

  console.log("Connected to the database");

  ensureSchemaIsSetup(function(err)
  {
    if (err)
    {
      console.error(
        "Failed to set up the database schema: %s", err.message || err
      );
      process.exit(1);
    }
  });
});

/**
 * @private
 * @param {function(Error)=} done
 */
function ensureSchemaIsSetup(done)
{
  var steps = [];

  _.each(schema, function(classDef, className)
  {
    if (db.getClassByName(className) !== null)
    {
      return;
    }

    steps.push(function createClassStep(err)
    {
      if (err)
      {
        throw err;
      }

      var superClass = classDef.extends;

      delete classDef.extends;

      createClass(className, superClass, classDef);
    });
  });

  if (_.isFunction(done))
  {
    steps.push(done);
  }

  if (steps.length > 0)
  {
    step.apply(step, steps);
  }
}

/**
 * @private
 * @param {String} className
 * @param {String|null} superClass
 * @param {Object} properties
 * @param {function(Error)=} done
 */
function createClass(className, superClass, properties, done)
{
  var steps = [];

  steps.push(function createClass()
  {
    db.createClass(className, superClass, this.val());
  });

  _.each(properties, function(propertyDef, propertyName)
  {
    if (_.isString(propertyDef))
    {
      propertyDef = {type: propertyDef};
    }

    steps.push(
      createCreatePropertyStep(
        className, propertyName, propertyDef
      )
    );
  });

  if (_.isFunction(done))
  {
    steps.push(done);
  }

  step.apply(null, steps);
}

/**
 * @private
 * @param {String} className
 * @param {String} propertyName
 * @param {Object} propertyDef
 * @return {function(Error)}
 */
function createCreatePropertyStep(className, propertyName, propertyDef)
{
  return function createProperty(err)
  {
    if (err)
    {
      throw err;
    }

    var sql = createCreatePropertyCommand(className, propertyName, propertyDef);

    delete propertyDef.type;
    delete propertyDef.linkedType;
    delete propertyDef.linkedClass;

    var nextStep = this.val();

    db.command(sql, function(err)
    {
      if (err)
      {
        nextStep(err);
      }
      else
      {
        setPropertyAttributes(className, propertyName, propertyDef, nextStep);
      }
    });
  };
}

/**
 * @private
 * @param {String} className
 * @param {String} propertyName
 * @param {Object} attributes
 * @param {function(Error)=} done
 */
function setPropertyAttributes(className, propertyName, attributes, done)
{
  if (_.size(attributes) === 0)
  {
    if (_.isFunction(done))
    {
      process.nextTick(done);
    }

    return;
  }

  var steps = [];

  _.each(attributes, function(attrValue, attrName)
  {
    steps.push(function alterPropertyStep(err)
    {
      if (err)
      {
        throw err;
      }

      var sql = createAlterPropertyCommand(
        className, propertyName, attrName, attrValue
      );

      db.command(sql, this.val());
    });
  });

  if (_.isFunction(done))
  {
    steps.push(done);
  }

  step.apply(null, steps);
}

/**
 * @private
 * @param {String} className
 * @param {String} propertyName
 * @param {Object} propertyDef
 * @return {String}
 */
function createCreatePropertyCommand(className, propertyName, propertyDef)
{
  return format(
    "CREATE PROPERTY %s.%s %s %s",
    className,
    propertyName,
    propertyDef.type,
    propertyDef.linkedType || propertyDef.linkedClass || ''
  );
}

/**
 * @private
 * @param {String} className
 * @param {String} propertyName
 * @param {Object} attrName
 * @param {*} attrValue
 * @return {String}
 */
function createAlterPropertyCommand(
  className, propertyName, attrName, attrValue)
{
  return format(
    "ALTER PROPERTY %s.%s %s %s",
    className,
    propertyName,
    attrName.toUpperCase(),
    attrValue
  );
}
