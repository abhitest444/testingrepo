@cucumber
Feature: Inventory sorting
  As a shopper
  I want to sort the product list
  So that I can find items faster

  Background:
    Given I am logged in as a standard user
    And I am on the products page

  Scenario Outline: Sort products by name
    When I sort products by <order>
    Then the product names should be sorted <direction>

    Examples:
      | order  | direction    |
      | A to Z | ascending   |
      | Z to A | descending  |
