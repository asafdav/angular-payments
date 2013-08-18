angular.module('angularPayments')

.directive('stripeForm', ['$window', '$parse', 'Common', function($window, $parse, Common) {
    
  // directive intercepts form-submission, obtains Stripe's cardToken using stripe.js
  // and then passes that to callback provided in stripeForm, attribute.

  // data that is sent to stripe is filtered from scope, looking for valid values to
  // send and converting camelCase to snake_case, e.g expMonth -> exp_month


  // filter valid stripe-values from scope and convert them from camelCase to snake_case
  _getDataToSend = function(data){
           
    var possibleKeys = ['number', 'expMonth', 'expYear', 
                    'cvc', 'name','addressLine1', 
                    'addressLine2', 'addressCity',
                    'addressState', 'addressZip',
                    'addressCountry']
    
    var camelToSnake = function(str){
      return str.replace(/([A-Z])/g, function(m){
        return "_"+m.toLowerCase();
      });
    }

    var ret = {};

    for(i in possibleKeys){
      ret[camelToSnake(possibleKeys[i])] = angular.copy(data[possibleKeys[i]]);

      if (angular.isObject(ret[camelToSnake(possibleKeys[i])])) {
        ret[camelToSnake(possibleKeys[i])] = ret[camelToSnake(possibleKeys[i])].$viewValue;
      }
    }

    ret['number'] = ret['number'].replace(/ /g,'');

    return ret;
  }

  return {
    restrict: 'A',
    link: function(scope, elem, attr) {

      if(!$window.Stripe){
          throw 'stripeForm requires that you have stripe.js installed. Include https://js.stripe.com/v2/ into your html.';
      }

      var form = angular.element(elem);

      form.bind('submit', function() {
        var formName = attr['name'];
        var hasName = (angular.isDefined(formName) & (formName !== ""));
        var formData = hasName ? scope[formName] : scope;

        console.log(scope[formName]);

        expMonthUsed = formData.expiryMonth ? true : false;
        expYearUsed = formData.expiryYear ? true : false;

        if(!(expMonthUsed && expYearUsed)){
          exp = Common.parseExpiry(formData.expiry)
          scope.expMonth = exp.month
          scope.expYear = exp.year
        }

        var button = form.find('button');
        button.prop('disabled', true);

        if(form.hasClass('ng-valid')) {
          $window.Stripe.createToken(_getDataToSend(formData), function() {
            var args = arguments;
            scope.$apply(function() {
              scope[attr.stripeForm].apply(scope, args);
            });
            button.prop('disabled', false);

          });

        }

        scope.expiryMonth = expMonthUsed ? scope.expMonth : null;
        scope.expiryYear = expYearUsed ? scope.expMonth : null;

        scope.expiryMonth = angular.isObject(scope.expMonth) ? scope.expMonth.$viewValue : scope.expMonth;
        scope.expiryYear = angular.isObject(scope.expiryYear) ? scope.expiryYear.$viewValue : scope.expiryYear;
      });
    }
  }
}])
