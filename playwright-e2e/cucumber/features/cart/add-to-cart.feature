@cucumber
Feature: Shopping cart
  As a logged-in shopper
  I want to add products to my cart
  So that I can purchase them later

  Background:
    Given I am logged in as a standard user
    And I am on the products page

  @smoke
  Scenario: Add a single product to the cart
    When I add "Sauce Labs Backpack" to the cart
    Then the cart badge should show 1
    When I open the cart
    Then I should see the cart page
    And the cart should contain:
      | product             |
      | Sauce Labs Backpack |

  Scenario: Add multiple products from a table
    When I add the following products to the cart:
      | product                |
      | Sauce Labs Backpack    |
      | Sauce Labs Bike Light  |
    Then the cart badge should show 2
    When I open the cart
    Then the cart should contain:
      | product                |
      | Sauce Labs Backpack    |
      | Sauce Labs Bike Light  |
