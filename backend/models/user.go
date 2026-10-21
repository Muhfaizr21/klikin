package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserRole string

const (
	RoleSuperAdmin   UserRole = "SUPER_ADMIN"
	RoleAccountOwner UserRole = "ACCOUNT_OWNER"
)

type User struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	FullName  string    `gorm:"type:varchar(128)" json:"full_name"`
	Password  string    `gorm:"not null" json:"-"`
	Role      UserRole  `gorm:"type:varchar(32);default:'ACCOUNT_OWNER'" json:"role"`
	IsPro     bool      `gorm:"default:false" json:"is_pro"`
	Pages     []BioPage `gorm:"foreignKey:UserID" json:"pages,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// HashPassword hashes a raw password using bcrypt
func (u *User) HashPassword(plainPassword string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(bytes)
	return nil
}

// CheckPassword compares a plaintext password with the hashed password
func (u *User) CheckPassword(plainPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(plainPassword))
	return err == nil
}
