import { User } from './user.entity';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with valid data', () => {
      const user = User.create('test-id', {
        name: 'Test User',
        biography: 'Test bio',
        category: 'influencer'
      });

      expect(user.id).toBe('test-id');
      expect(user.name).toBe('Test User');
      expect(user.biography).toBe('Test bio');
      expect(user.category).toBe('influencer');
    });

    it('should throw error when creating user without id', () => {
      expect(() => {
        User.create('');
      }).toThrow('User ID is required');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile and set hasInfo to true', () => {
      const user = User.create('test-id');
      
      user.updateProfile('New Name', 'New Bio', 'artist');
      
      expect(user.name).toBe('New Name');
      expect(user.biography).toBe('New Bio');
      expect(user.category).toBe('artist');
      expect(user.hasInfo).toBe(true);
    });
  });

  describe('enableUser and disableUser', () => {
    it('should enable and disable user', () => {
      const user = User.create('test-id');
      
      user.disableUser();
      expect(user.enable).toBe(false);
      
      user.enableUser();
      expect(user.enable).toBe(true);
    });
  });
});
