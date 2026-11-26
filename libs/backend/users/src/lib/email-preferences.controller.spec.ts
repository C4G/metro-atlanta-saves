import { BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { EmailPreferencesController } from './email-preferences.controller';
import { EmailPreferencesService } from './email-preferences.service';

describe('EmailPreferencesController', () => {
  const makeResponse = () => {
    const response = {
      status: jest.fn(),
      type: jest.fn(),
      send: jest.fn(),
    };
    response.status.mockReturnValue(response);
    response.type.mockReturnValue(response);
    return response as unknown as Response & typeof response;
  };

  const createController = () => {
    const emailPreferences = {
      verifyUnsubscribeToken: jest.fn(),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      assertSharedPreferenceRequest: jest.fn(),
      getSuppressedCampaignEmails: jest.fn().mockResolvedValue(['opted-out@example.com']),
    } as unknown as jest.Mocked<EmailPreferencesService>;
    return { controller: new EmailPreferencesController(emailPreferences), emailPreferences };
  };

  it('shows a confirmation form for a valid GET unsubscribe link without unsubscribing immediately', () => {
    const { controller, emailPreferences } = createController();
    emailPreferences.verifyUnsubscribeToken.mockReturnValue('member@example.com');
    const response = makeResponse();
    const token = 'v1.payload.signature';

    controller.showUnsubscribeConfirmation(token, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.type).toHaveBeenCalledWith('html');
    expect(response.send).toHaveBeenCalledWith(expect.stringContaining('Confirm that you want to stop'));
    expect(response.send).toHaveBeenCalledWith(expect.stringContaining('method="post"'));
    expect(response.send).toHaveBeenCalledWith(expect.stringContaining(`/api/users/unsubscribe?token=${token}`));
    expect(emailPreferences.unsubscribe).not.toHaveBeenCalled();
  });

  it('returns an invalid-link page for an invalid GET unsubscribe link', () => {
    const { controller, emailPreferences } = createController();
    emailPreferences.verifyUnsubscribeToken.mockReturnValue(undefined);
    const response = makeResponse();

    controller.showUnsubscribeConfirmation('bad-token', response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.send).toHaveBeenCalledWith(expect.stringContaining('This unsubscribe link is invalid or expired.'));
  });

  it('handles a one-click POST by persisting the opt-out and returning a confirmation page', async () => {
    const { controller, emailPreferences } = createController();
    const response = makeResponse();

    await controller.unsubscribe('v1.payload.signature', response);

    expect(emailPreferences.unsubscribe).toHaveBeenCalledWith('v1.payload.signature');
    expect(response.type).toHaveBeenCalledWith('html');
    expect(response.send).toHaveBeenCalledWith(expect.stringContaining('You have been unsubscribed'));
  });

  it('rejects a one-click POST without a token', async () => {
    const { controller, emailPreferences } = createController();

    await expect(controller.unsubscribe(undefined, makeResponse())).rejects.toBeInstanceOf(BadRequestException);
    expect(emailPreferences.unsubscribe).not.toHaveBeenCalled();
  });

  it('authorizes and returns suppression state for the shared preference endpoint', async () => {
    const { controller, emailPreferences } = createController();
    const request = { body: { emails: ['member@example.com'] } } as Request;

    await expect(controller.campaignSuppressions('Bearer shared-secret', request)).resolves.toEqual({
      suppressedEmails: ['opted-out@example.com'],
    });
    expect(emailPreferences.assertSharedPreferenceRequest).toHaveBeenCalledWith('Bearer shared-secret');
    expect(emailPreferences.getSuppressedCampaignEmails).toHaveBeenCalledWith(['member@example.com']);
  });

  it('rejects oversized suppression lookups after authorization', async () => {
    const { controller, emailPreferences } = createController();
    const request = { body: { emails: Array.from({ length: 501 }, () => 'member@example.com') } } as Request;

    await expect(controller.campaignSuppressions('Bearer shared-secret', request)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(emailPreferences.getSuppressedCampaignEmails).not.toHaveBeenCalled();
  });
});
