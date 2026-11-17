from django.db import models

# Create your models here.

class Student(models.Model):
    name = models.CharField(max_length=100)
    roll_number = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    max_marks = models.PositiveIntegerField(default=100)
    pass_marks = models.PositiveIntegerField(default=35)

    def __str__(self):
        return self.name


class StudentMark(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='marks'
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE
    )

    marks_obtained = models.PositiveIntegerField()

    class Meta:
        unique_together = ('student', 'subject')

    def __str__(self):
        return f"{self.student.name} - {self.subject.name}"