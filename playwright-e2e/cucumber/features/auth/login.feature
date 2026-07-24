Feature: Authentication
  As a shopper
  I want to sign in with my credentials
  So that I can browse and buy products

  Background:
    Given I am on the login page

  @smoke @cucumber
  Scenario: Standard user can log in
    When I log in as a standard user
    Then I should see the products page

  @cucumber
  Scenario: Locked out user is blocked
    When I log in as a locked user
    Then I should remain on the login page
    And I should see a login error containing "Sorry, this user has been locked out"

  @cucumber
  Scenario Outline: Invalid login attempts are rejected
    When I attempt to log in with username "<username>" and password "<password>"
    Then I should see a login error containing "<message>"

    Examples:
      | username      | password     | message                            |
      | not_a_user    | wrong        | Username and password do not match |
      |               | secret_sauce | Username is required               |
      | standard_user |              | Password is required               |
