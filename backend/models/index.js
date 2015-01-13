'use strict';
/**
 * @module Models
 * classes to represent our models.
 *
 * @description
 * Each member is a class.<br/>
 * Use it as follows
 * <pre>
 *     var models = require('../models');
 *     var user = new models.User();
 * </pre>
 *
 * @type {exports}
 */
exports.recipeType = require('./RecipeType'); // deprecated syntax. don't use.
exports.RecipeType = require('./RecipeType');
exports.User = require('./User');