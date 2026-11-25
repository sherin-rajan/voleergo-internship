from django.shortcuts import render,redirect,get_object_or_404
from .forms import StudentForm,SubjectForm,StudentMarkForm
from .models import Student, Subject, StudentMark
from .utils import calculate_student_result
from django.db.models import Q, Avg
from django.core.paginator import Paginator

# Create your views here.

def home(request):
    return render(request, 'home.html')

def add_student(request):
    if request.method == 'POST':
        form = StudentForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('student_list')

    else:
        form = StudentForm()

    return render(request, 'add_student.html', {'form': form})

def edit_student(request, id):
    student = get_object_or_404(Student, id=id)

    if request.method == 'POST':
        form = StudentForm(request.POST, instance=student)

        if form.is_valid():
            form.save()
            return redirect('student_detail', id=student.id)

    else:
        form = StudentForm(instance=student)

    return render(request, 'edit_student.html', {
        'form': form,
        'student': student
    })


def delete_student(request, id):
    student = get_object_or_404(Student, id=id)

    if request.method == 'POST':
        student.delete()
        return redirect('student_list')

    return render(request, 'delete_student.html', {
        'student': student
    })


def add_subject(request):
    if request.method == 'POST':
        form = SubjectForm(request.POST)

        if form.is_valid():
            form.save()
            return redirect('home')

    else:
        form = SubjectForm()

    return render(request, 'add_subject.html', {'form': form})

def subject_list(request):
    subjects = Subject.objects.all()

    return render(request, 'subject_list.html', {
        'subjects': subjects
    })


def edit_subject(request, id):
    subject = get_object_or_404(Subject, id=id)

    if request.method == 'POST':
        form = SubjectForm(request.POST, instance=subject)

        if form.is_valid():
            form.save()
            return redirect('subject_list')

    else:
        form = SubjectForm(instance=subject)

    return render(request, 'edit_subject.html', {
        'form': form,
        'subject': subject
    })


def delete_subject(request, id):
    subject = get_object_or_404(Subject, id=id)

    if request.method == 'POST':
        subject.delete()
        return redirect('subject_list')

    return render(request, 'delete_subject.html', {
        'subject': subject
    })

def student_list(request):
    query = request.GET.get('search', '')
    result_filter = request.GET.get('result', '')

    students = Student.objects.all()

    if query:
        students = students.filter(
            Q(name__icontains=query) |
            Q(roll_number__icontains=query)
        )

    student_list = []

    for student in students:
        result_data = calculate_student_result(student)

        result = result_data['result']

        student_list.append({
            'student': student,
            'result': result
        })

    # Apply result filter
    if result_filter:
        student_list = [
            item for item in student_list
            if item['result'].lower() == result_filter
        ]

    # Pagination
    paginator = Paginator(student_list, 5)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'student_list.html', {
        'students': page_obj.object_list,
        'page_obj': page_obj,
        'search': query,
        'result_filter': result_filter
    })

def student_detail(request, id):
    student = get_object_or_404(Student, id=id)
    results = calculate_student_result(student)

    return render(request, 'student_detail.html', {
        'student': student,
        'result': results
    })

def add_student_mark(request, id, subject_id=None):
    student = get_object_or_404(Student, id=id)

    selected_subject = None

    if subject_id:
        selected_subject = get_object_or_404(
            Subject,
            id=subject_id
        )

        # Prevent adding marks if already entered
        if StudentMark.objects.filter(
            student=student,
            subject=selected_subject
        ).exists():
            return redirect('student_detail', id=student.id)

    if request.method == 'POST':
        form = StudentMarkForm(
            request.POST,
            student=student,
            selected_subject=selected_subject
        )

        if form.is_valid():
            mark = form.save(commit=False)
            mark.student = student
            mark.save()

            return redirect('student_detail', id=student.id)

    else:
        form = StudentMarkForm(
            student=student,
            selected_subject=selected_subject
        )

    return render(request, 'add_mark.html', {
        'form': form,
        'student': student
    })

def edit_student_mark(request, student_id, mark_id):
    student = get_object_or_404(Student, id=student_id)

    mark = get_object_or_404(
        StudentMark,
        id=mark_id,
        student=student
    )

    if request.method == 'POST':
        form = StudentMarkForm(
            request.POST,
            instance=mark,
            student=student
        )

        if form.is_valid():
            form.save()
            return redirect('student_detail', id=student.id)

    else:
        form = StudentMarkForm(
            instance=mark,
            student=student
        )

    return render(request, 'edit_mark.html', {
        'form': form,
        'student': student
    })


def delete_student_mark(request, student_id, mark_id):
    student = get_object_or_404(Student, id=student_id)

    mark = get_object_or_404(
        StudentMark,
        id=mark_id,
        student=student
    )

    if request.method == 'POST':
        mark.delete()
        return redirect('student_detail', id=student.id)

    return render(request, 'delete_mark.html', {
        'student': student,
        'mark': mark
    })


def dashboard(request):
    students = Student.objects.all()
    subjects = Subject.objects.all()

    total_students = students.count()
    total_subjects = subjects.count()

    completed_results = 0
    pending_results = 0
    passed_students = 0
    failed_students = 0

    # Calculate overall student results
    top_student = None
    for student in students:
        result = calculate_student_result(student)

        if result['result'] == 'Incomplete':
            pending_results += 1
        else:
            completed_results += 1

            if result['result'] == 'Pass':
                passed_students += 1
            else:
                failed_students += 1

        if result['percentage'] is not None:
            if (
                top_student is None or
                result['percentage'] > top_student['percentage']
            ):
                top_student = {
                    'name': student.name,
                    'roll_number': student.roll_number,
                    'percentage': result['percentage']
                }

    if total_subjects == 0:
        pending_results = total_students

    # Calculate subject-wise average performance
    subject_performance = []

    for subject in subjects:
        average = StudentMark.objects.filter(
            subject=subject,
            exam_status='present',
            marks_obtained__isnull=False
        ).aggregate(average=Avg('marks_obtained'))['average']

        if average is not None and subject.max_marks > 0:
            percentage = round(
                (average / subject.max_marks) * 100, 2
            )
        else:
            percentage = 0

        subject_performance.append({
            'subject': subject.name,
            'average': percentage
        })

    context = {
        'total_students': total_students,
        'total_subjects': total_subjects,
        'completed_results': completed_results,
        'pending_results': pending_results,
        'passed_students': passed_students,
        'failed_students': failed_students,
        'top_student': top_student,
        'subject_performance': subject_performance,
    }

    return render(request, 'dashboard.html', context)

def result_students(request, result_type):

    students = Student.objects.all()
    filtered_students = []

    for student in students:

        result_data = calculate_student_result(student)
        result = result_data['result']

        if result_type == 'completed':
            if result in ['Pass', 'Fail']:
                filtered_students.append(student)

        elif result_type == 'pending':
            if result == 'Incomplete':
                filtered_students.append(student)

        elif result_type == 'passed':
            if result == 'Pass':
                filtered_students.append(student)

        elif result_type == 'failed':
            if result == 'Fail':
                filtered_students.append(student)

    return render(request, 'result_students.html', {
        'students': filtered_students,
        'result_type': result_type
    })
